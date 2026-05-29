import os
import uuid
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool

from app.models.base import Base
# Import all models to ensure metadata is populated
import app.models.user
import app.models.restaurant
import app.models.menu
import app.models.order
import app.models.delivery
import app.models.cart
import app.models.address
import app.models.payment
import app.models.audit

from app.constants import UserRole, OrderStatus

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    pytest.fail("TEST_DATABASE_URL environment variable is required for testing. Example: postgresql+asyncpg://postgres:postgres@localhost:5432/swigato_test")

# Engine with NullPool to prevent connection sharing issues across concurrency tests
test_engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool, echo=False)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=test_engine, class_=AsyncSession)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        # We explicitly drop and create for a clean slate. 
        # In a real environment, you might use Alembic, but create_all is faster for tests.
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()

@pytest_asyncio.fixture
async def db_session():
    """
    Function-scoped DB session. Use for standard integration tests.
    It does not automatically rollback at the end because we dropped the schema and are just inserting test data.
    Actually, to keep tests isolated, we should wrap in a transaction and rollback.
    """
    connection = await test_engine.connect()
    transaction = await connection.begin()
    session = AsyncSession(bind=connection, join_transaction_mode="create_savepoint")
    
    yield session
    
    await session.close()
    await transaction.rollback()
    await connection.close()

@pytest.fixture
def session_factory():
    """
    Returns a factory that creates fresh, independent AsyncSessions. 
    Crucial for concurrency tests where we need 3 simultaneous connections that can block each other.
    """
    return TestingSessionLocal

# --- Mock Event Bus ---

class MockEventBus:
    def __init__(self):
        self.published_events = []

    async def safe_publish(self, tenant_scope: str, event_envelope):
        self.published_events.append({
            "scope": tenant_scope,
            "event": event_envelope
        })
        
    async def publish(self, tenant_scope: str, event_envelope):
        await self.safe_publish(tenant_scope, event_envelope)

@pytest.fixture(autouse=True)
def mock_event_bus(monkeypatch):
    mock_bus = MockEventBus()
    # Patch the global event bus
    monkeypatch.setattr("app.realtime.event_bus.event_bus", mock_bus)
    # Also patch it in specific services just in case they import it directly
    monkeypatch.setattr("app.services.order_service.event_bus", mock_bus)
    monkeypatch.setattr("app.services.delivery_service.event_bus", mock_bus)
    return mock_bus

# --- Test Data Builders ---

@pytest_asyncio.fixture
async def create_customer(db_session):
    async def _builder(email="customer@test.com"):
        user = app.models.user.User(
            email=email,
            full_name="Test Customer",
            hashed_password="fake",
            role=UserRole.CUSTOMER.value
        )
        db_session.add(user)
        await db_session.flush()
        return user
    return _builder

@pytest_asyncio.fixture
async def create_owner_and_restaurant(db_session):
    async def _builder(email="owner@test.com", restaurant_name="Test Rest"):
        user = app.models.user.User(
            email=email,
            full_name="Test Owner",
            hashed_password="fake",
            role=UserRole.RESTAURANT_OWNER.value
        )
        db_session.add(user)
        await db_session.flush()
        
        restaurant = app.models.restaurant.Restaurant(
            owner_id=user.id,
            name=restaurant_name,
            address="123 Test St",
            is_active=True
        )
        db_session.add(restaurant)
        await db_session.flush()
        return user, restaurant
    return _builder

@pytest_asyncio.fixture
async def create_delivery_partner(db_session):
    async def _builder(email="rider@test.com", is_online=True):
        user = app.models.user.User(
            email=email,
            full_name="Test Rider",
            hashed_password="fake",
            role=UserRole.DELIVERY_PARTNER.value
        )
        db_session.add(user)
        await db_session.flush()
        
        partner = app.models.delivery.DeliveryPartnerProfile(
            user_id=user.id,
            vehicle_type="bike",
            is_verified=True,
            is_online=is_online,
            is_suspended=False
        )
        db_session.add(partner)
        await db_session.flush()
        return user, partner
    return _builder

@pytest_asyncio.fixture
async def build_cart_with_items(db_session):
    async def _builder(customer, restaurant):
        menu_item = app.models.menu.MenuItem(
            restaurant_id=restaurant.id,
            name="Burger",
            price=10.00,
            is_available=True
        )
        db_session.add(menu_item)
        await db_session.flush()
        
        cart = app.models.cart.Cart(user_id=customer.id, restaurant_id=restaurant.id)
        db_session.add(cart)
        await db_session.flush()
        
        cart_item = app.models.cart.CartItem(cart_id=cart.id, menu_item_id=menu_item.id, quantity=2)
        db_session.add(cart_item)
        await db_session.flush()
        
        # Need an address for checkout
        address = app.models.address.Address(
            user_id=customer.id,
            street="123 Customer Ave",
            city="City",
            state="State",
            zip_code="12345"
        )
        db_session.add(address)
        await db_session.flush()
        
        return cart, menu_item, address
    return _builder

@pytest_asyncio.fixture
async def create_pending_order(db_session, create_customer, create_owner_and_restaurant, build_cart_with_items):
    async def _builder():
        from app.services.order_service import OrderService
        from app.schemas.order import OrderCreate
        
        customer = await create_customer()
        owner, restaurant = await create_owner_and_restaurant()
        cart, menu_item, address = await build_cart_with_items(customer, restaurant)
        
        service = OrderService(db_session)
        order_resp = await service.create_order(customer.id, OrderCreate(delivery_address_id=address.id, notes=""))
        return customer, owner, restaurant, order_resp.id
    return _builder
