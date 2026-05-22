"""
tests/conftest.py
──────────────────
Shared pytest fixtures for unit and integration tests.

Test DB strategy:
- Uses a separate test database (swigato_test_db)
- Each test runs in a transaction that is rolled back after the test
  → Tests are fully isolated with zero cleanup overhead
- NullPool prevents connection pool leakage between tests
"""
from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from typing import Any

import pytest
import pytest_asyncio
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.config import Settings, get_settings
from app.database import get_session
from app.main import create_app
from app.models.base import Base
from app.models.user import Role  # noqa: F401 — ensure tables are created

# ─── Test settings override ───────────────────────────────────────────────────

TEST_DATABASE_URL = "postgresql+asyncpg://swigato:swigato_pass@localhost:5432/swigato_test_db"


@pytest.fixture(scope="session")
def rsa_key_pair() -> tuple[str, str]:
    """Generate a temporary RSA key pair for JWT signing in tests."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()
    return private_pem, public_pem


@pytest.fixture(scope="session", autouse=True)
def override_settings(rsa_key_pair: tuple[str, str]) -> None:
    """Override settings for the test session."""
    private_pem, public_pem = rsa_key_pair

    class TestSettings(Settings):
        app_env: str = "testing"
        database_url: str = TEST_DATABASE_URL
        redis_url: str = "redis://localhost:6379/3"  # DB 3 for tests

        @property
        def jwt_private_key(self) -> str:
            return private_pem

        @property
        def jwt_public_key(self) -> str:
            return public_pem

    get_settings.cache_clear()
    import app.config as config_module
    config_module.get_settings = lambda: TestSettings()  # type: ignore


# ─── Database fixtures ────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    """Single event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create test database tables once per test session."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a test-scoped DB session that rolls back after each test.
    This gives complete test isolation without truncating tables.
    """
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False)
    async with session_factory() as session:
        async with session.begin():
            yield session
            await session.rollback()


# ─── App fixtures ─────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Async test client with overridden DB session dependency.
    Uses the rolled-back session so test data doesn't persist.
    """
    app = create_app()

    # Override get_session to use test session
    async def override_get_session():
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


# ─── Helper fixtures ──────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def seed_roles(db_session: AsyncSession) -> None:
    """Seed roles into the test DB session."""
    from app.core.constants import UserRole

    for role_name in UserRole:
        role = Role(name=role_name.value, description=f"Test role: {role_name.value}")
        db_session.add(role)
    await db_session.flush()


@pytest_asyncio.fixture
async def registered_user(client: AsyncClient, seed_roles) -> dict[str, Any]:
    """Register and return a test user (unverified)."""
    response = await client.post("/api/v1/auth/register", json={
        "first_name": "Test",
        "last_name": "User",
        "email": "test@swigato.com",
        "password": "SecurePass1!",
    })
    assert response.status_code == 201
    return response.json()


@pytest_asyncio.fixture
async def verified_user_tokens(
    client: AsyncClient,
    db_session: AsyncSession,
    registered_user: dict,
) -> dict[str, str]:
    """
    Register a user, manually verify their email in DB, and login.
    Returns {"access_token": ..., "refresh_token": ...}
    """
    from sqlalchemy import select, update
    from app.models.user import User, EmailVerification

    # Force-verify email in DB
    await db_session.execute(
        update(User)
        .where(User.email == "test@swigato.com")
        .values(is_email_verified=True)
    )
    await db_session.flush()

    response = await client.post("/api/v1/auth/login", json={
        "email": "test@swigato.com",
        "password": "SecurePass1!",
    })
    assert response.status_code == 200
    data = response.json()
    # Refresh token is in cookie
    refresh_token = response.cookies.get("refresh_token", "")
    return {"access_token": data["access_token"], "refresh_token": refresh_token}
