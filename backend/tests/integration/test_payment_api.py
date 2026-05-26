import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.constants import OrderStatus, PaymentGateway, PaymentStatus
from app.models.order import Order
from app.models.payment import Payment
from app.models.restaurant import Restaurant

pytestmark = pytest.mark.anyio


@pytest_asyncio.fixture
async def test_restaurant(db_session: AsyncSession):
    restaurant = Restaurant(
        owner_id=1,  # Assuming a dummy owner or we can just use any integer since foreign key might not be strictly checked if owner doesn't exist, wait, foreign key constraints might fail. 
        # Actually, let's use the test_user id
    )
    # It's better to create a full mock order without hitting all foreign key constraints if possible, or build it properly.
    pass

# We will create the order directly in the DB using the test_user.
@pytest_asyncio.fixture
async def test_order(db_session: AsyncSession, test_user):
    # Create dummy restaurant
    restaurant = Restaurant(
        owner_id=test_user.id,
        name="Test Restaurant",
        slug=f"test-restaurant-{uuid.uuid4().hex[:6]}",
        email=f"rest-{uuid.uuid4().hex[:6]}@test.com",
        phone="1234567890",
        address="123 Test St",
        city="Test City",
        state="Test State",
        postal_code="123456",
        is_open=True
    )
    db_session.add(restaurant)
    await db_session.commit()

    order = Order(
        customer_id=test_user.id,
        restaurant_id=restaurant.id,
        status=OrderStatus.PENDING.value,
        subtotal=100.0,
        delivery_fee=10.0,
        tax_amount=5.0,
        discount_amount=0.0,
        total_amount=115.0
    )
    db_session.add(order)
    await db_session.commit()
    return order


@pytest_asyncio.fixture
async def test_payment(db_session: AsyncSession, test_user, test_order):
    payment = Payment(
        order_id=test_order.id,
        customer_id=test_user.id,
        gateway=PaymentGateway.RAZORPAY.value,
        provider_payment_id="mock_order_123",
        amount=115.0,
        currency="INR",
        status=PaymentStatus.PENDING.value
    )
    db_session.add(payment)
    await db_session.commit()
    return payment


async def test_payment_initialization(
    client: AsyncClient,
    verified_user_tokens: dict,
    db_session: AsyncSession,
    test_order: Order
):
    # order should be PENDING
    assert test_order.status == OrderStatus.PENDING.value

    # Initialize payment
    headers = {"Authorization": f"Bearer {verified_user_tokens['access_token']}"}
    payload = {"gateway": "razorpay"}
    response = await client.post(
        f"/api/v1/payments/orders/{test_order.id}/initialize",
        json=payload,
        headers=headers
    )
    
    assert response.status_code == 200, response.text
    data = response.json()
    assert "payment_id" in data
    assert "provider_payment_id" in data
    
    payment_id = data["payment_id"]

    # Verify DB state
    await db_session.refresh(test_order)
    assert test_order.status == OrderStatus.AWAITING_PAYMENT.value

    payment = await db_session.get(Payment, uuid.UUID(payment_id))
    assert payment is not None
    assert payment.status == PaymentStatus.PENDING.value
    assert payment.gateway == PaymentGateway.RAZORPAY.value


async def test_payment_webhook_idempotency_and_capture(
    client: AsyncClient,
    db_session: AsyncSession,
    test_order: Order,
    test_payment: Payment
):
    # Setup test_order to AWAITING_PAYMENT
    test_order.status = OrderStatus.AWAITING_PAYMENT.value
    await db_session.commit()
    
    webhook_payload = {
        "event_id": "evt_test123",
        "type": "payment.captured",
        "provider_payment_id": test_payment.provider_payment_id,
        "status": "captured",
        "method": "card"
    }

    headers = {"X-Signature": "valid"}

    # First call - should process
    response = await client.post(
        "/api/v1/payments/webhooks/razorpay",
        json=webhook_payload,
        headers=headers
    )
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "processed"

    # Verify DB
    await db_session.refresh(test_payment)
    assert test_payment.status == PaymentStatus.CAPTURED.value
    assert test_payment.payment_method == "card"
    
    await db_session.refresh(test_order)
    assert test_order.status == OrderStatus.PLACED.value

    # Second call (duplicate webhook) - should be ignored safely
    response = await client.post(
        "/api/v1/payments/webhooks/razorpay",
        json=webhook_payload,
        headers=headers
    )
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "ignored"
    assert response.json()["reason"] == "duplicate_event"
