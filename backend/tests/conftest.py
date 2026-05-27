import os
import asyncio
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine, AsyncEngine
from sqlalchemy.pool import NullPool
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

# ─── 1. Setup Test Settings BEFORE app imports ────────────────────────────────

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:mypassword@localhost:5432/swigato_test_db"
os.environ["APP_ENV"] = "testing"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()
private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
).decode("utf-8")
public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo
).decode("utf-8")

import app.config as config_module
from app.config import Settings, get_settings

class TestSettings(Settings):
    app_env: str = "testing"
    database_url: str = TEST_DATABASE_URL
    redis_url: str = "redis://localhost:6379/3"

    @property
    def jwt_private_key(self) -> str:
        return private_pem

    @property
    def jwt_public_key(self) -> str:
        return public_pem

_test_settings = TestSettings()

config_module.get_settings.cache_clear()
config_module.get_settings = lambda: _test_settings
import app.config
app.config.get_settings = config_module.get_settings

# ─── 2. Import app modules AFTER patch ────────────────────────────────────────

from app.database import get_session
from app.models.base import Base
from app.models import *

# ─── 3. Fixtures ──────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="session")
async def test_engine() -> AsyncGenerator[AsyncEngine, None]:
    engine = create_async_engine(get_settings().database_url, poolclass=NullPool)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    from app.main import _seed_roles
    from sqlalchemy.ext.asyncio import async_sessionmaker
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    
    import app.database
    original_factory = app.database._async_session_factory
    app.database._async_session_factory = session_factory
    
    await _seed_roles()

    yield engine
    
    # We intentionally do not drop tables here to avoid hangs on teardown if connections
    # are left in a weird state. The tables are dropped at the start of the next test session anyway.
    app.database._async_session_factory = original_factory
    await engine.dispose()

@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False)
    async with session_factory() as session:
        await session.begin()
        try:
            yield session
        finally:
            await session.rollback()

@pytest_asyncio.fixture
async def fake_redis_session():
    import fakeredis.aioredis
    # Create the FakeRedis instance in the session loop
    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield redis
    await redis.aclose()

@pytest_asyncio.fixture
async def client(test_engine, fake_redis_session) -> AsyncGenerator[AsyncClient, None]:
    from app.main import create_app
    from unittest.mock import patch
    from contextlib import asynccontextmanager
    import app.redis

    app.redis._cache_client = fake_redis_session
    
    app_instance = create_app()

    @asynccontextmanager
    async def mock_lifespan(app):
        yield

    async def mock_rate_limit(self, request, call_next):
        return await call_next(request)

    with patch('app.main.lifespan', new=mock_lifespan), \
         patch('app.core.middleware.RateLimitMiddleware.dispatch', new=mock_rate_limit):
        transport = ASGITransport(app=app_instance)
        async with AsyncClient(transport=transport, base_url="http://testserver") as c:
            yield c


@pytest_asyncio.fixture
async def registered_user(client: AsyncClient):
    # Register an unverified user
    await client.post("/api/v1/auth/register", json={
        "first_name": "Registered",
        "last_name": "User",
        "email": "test@swigato.com",
        "password": "SecurePass1!",
    })
    return {"email": "test@swigato.com", "password": "SecurePass1!"}

@pytest_asyncio.fixture
async def verified_user_tokens(client: AsyncClient, db_session):
    email = "verified@swigato.com"
    password = "SecurePass1!"
    await client.post("/api/v1/auth/register", json={
        "first_name": "Verified",
        "last_name": "User",
        "email": email,
        "password": password,
    })
    
    from sqlalchemy import update
    from app.models.user import User
    await db_session.execute(
        update(User).where(User.email == email).values(is_email_verified=True)
    )
    await db_session.commit()
    
    response = await client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
    })
    data = response.json()
    refresh_token = response.cookies.get("refresh_token", "")
    return {
        "access_token": data.get("access_token", ""),
        "refresh_token": refresh_token,
        "email": email,
        "password": password
    }


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession, verified_user_tokens: dict):
    from sqlalchemy import select
    from app.models.user import User
    
    stmt = select(User).where(User.email == verified_user_tokens["email"])
    result = await db_session.execute(stmt)
    return result.scalar_one()

@pytest_asyncio.fixture
async def auth_headers(verified_user_tokens: dict):
    return {"Authorization": f"Bearer {verified_user_tokens['access_token']}"}


@pytest_asyncio.fixture
async def admin_token(client: AsyncClient, db_session: AsyncSession):
    email = "admin@swigato.com"
    password = "AdminPassword1!"
    await client.post("/api/v1/auth/register", json={
        "first_name": "Admin",
        "last_name": "User",
        "email": email,
        "password": password,
    })
    
    from sqlalchemy import update, select
    from app.models.user import User, Role, UserRole
    
    # Verify user
    await db_session.execute(
        update(User).where(User.email == email).values(is_email_verified=True)
    )
    # Assign admin role
    admin_role = (await db_session.execute(select(Role).where(Role.name == "admin"))).scalar_one()
    user = (await db_session.execute(select(User).where(User.email == email))).scalar_one()
    if not any(ur.role_id == admin_role.id for ur in user.user_roles):
        db_session.add(UserRole(user_id=user.id, role_id=admin_role.id))
        await db_session.commit()
    
    response = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return response.json().get("access_token", "")

@pytest_asyncio.fixture
async def restaurant_owner_token(client: AsyncClient, db_session: AsyncSession):
    email = "owner@swigato.com"
    password = "OwnerPassword1!"
    await client.post("/api/v1/auth/register", json={
        "first_name": "Owner",
        "last_name": "User",
        "email": email,
        "password": password,
    })
    
    from sqlalchemy import update, select
    from app.models.user import User, Role, UserRole
    
    # Verify user
    await db_session.execute(
        update(User).where(User.email == email).values(is_email_verified=True)
    )
    # Assign restaurant_owner role
    owner_role = (await db_session.execute(select(Role).where(Role.name == "restaurant_owner"))).scalar_one()
    user = (await db_session.execute(select(User).where(User.email == email))).scalar_one()
    if not any(ur.role_id == owner_role.id for ur in user.user_roles):
        db_session.add(UserRole(user_id=user.id, role_id=owner_role.id))
        await db_session.commit()
    
    response = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return response.json().get("access_token", "")


@pytest_asyncio.fixture
async def delivery_partner_token(client: AsyncClient, db_session: AsyncSession):
    email = "delivery@swigato.com"
    password = "DeliveryPassword1!"
    await client.post("/api/v1/auth/register", json={
        "first_name": "Delivery",
        "last_name": "Partner",
        "email": email,
        "password": password,
    })
    
    from sqlalchemy import update, select
    from app.models.user import User, Role, UserRole
    
    # Verify user
    await db_session.execute(
        update(User).where(User.email == email).values(is_email_verified=True)
    )
    # Assign delivery_partner role
    delivery_role = (await db_session.execute(select(Role).where(Role.name == "delivery_partner"))).scalar_one()
    user = (await db_session.execute(select(User).where(User.email == email))).scalar_one()
    if not any(ur.role_id == delivery_role.id for ur in user.user_roles):
        db_session.add(UserRole(user_id=user.id, role_id=delivery_role.id))
        await db_session.commit()
    
    response = await client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return response.json().get("access_token", "")


