"""
tests/unit/test_auth_service.py
────────────────────────────────
Unit tests for AuthService business logic.

These tests use mock repositories — no DB needed.
They verify the service logic in pure Python.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    RefreshTokenInvalidError,
    TokenInvalidError,
)
from app.core.security import hash_password
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import AuthService


def make_mock_user(
    user_id: int = 1,
    email: str = "user@swigato.com",
    is_active: bool = True,
    is_email_verified: bool = True,
    roles: list[str] | None = None,
) -> MagicMock:
    user = MagicMock()
    user.id = user_id
    user.email = email
    user.is_active = is_active
    user.is_email_verified = is_email_verified
    user.password_hash = hash_password("SecurePass1!")
    user.role_names = roles or ["customer"]
    user.referral_code = "TESTCODE"
    user.referred_by_id = None
    return user


def make_mock_repo(**overrides) -> AsyncMock:
    repo = AsyncMock()
    repo.email_exists.return_value = False
    repo.phone_exists.return_value = False
    repo.get_by_referral_code.return_value = None
    repo.create.return_value = make_mock_user()
    repo.get_role_by_name.return_value = MagicMock(id=1, name="customer")
    repo.add_role.return_value = None
    repo.create_email_verification.return_value = MagicMock()
    repo.get_by_email.return_value = make_mock_user()
    repo.create_refresh_token.return_value = MagicMock()
    for k, v in overrides.items():
        setattr(repo, k, v)
    return repo


@pytest.mark.asyncio
class TestAuthServiceRegister:
    async def test_register_success(self) -> None:
        repo = make_mock_repo()
        svc = AuthService(repo)
        data = RegisterRequest(
            first_name="Jane",
            last_name="Doe",
            email="jane@swigato.com",
            password="SecurePass1!",
        )
        user = await svc.register(data)
        repo.create.assert_called_once()
        repo.add_role.assert_called_once()

    async def test_register_duplicate_email_raises(self) -> None:
        repo = make_mock_repo(email_exists=AsyncMock(return_value=True))
        svc = AuthService(repo)
        data = RegisterRequest(
            first_name="Dupe",
            last_name="User",
            email="existing@swigato.com",
            password="SecurePass1!",
        )
        with pytest.raises(EmailAlreadyExistsError):
            await svc.register(data)

    async def test_register_with_valid_referral(self) -> None:
        referrer = make_mock_user(user_id=99)
        repo = make_mock_repo(get_by_referral_code=AsyncMock(return_value=referrer))
        svc = AuthService(repo)
        data = RegisterRequest(
            first_name="New",
            last_name="User",
            email="new@swigato.com",
            password="SecurePass1!",
            referral_code="VALIDCODE",
        )
        await svc.register(data)
        # Verify referred_by_id was set in the create call
        call_kwargs = repo.create.call_args.kwargs
        assert call_kwargs.get("referred_by_id") == 99


@pytest.mark.asyncio
class TestAuthServiceLogin:
    async def test_login_success_returns_tokens(self) -> None:
        repo = make_mock_repo()
        svc = AuthService(repo)
        data = LoginRequest(email="user@swigato.com", password="SecurePass1!")
        access_token, refresh_token = await svc.login(data)
        assert access_token
        assert refresh_token

    async def test_login_wrong_password_raises(self) -> None:
        repo = make_mock_repo()
        svc = AuthService(repo)
        data = LoginRequest(email="user@swigato.com", password="WrongPassword1!")
        with pytest.raises(InvalidCredentialsError):
            await svc.login(data)

    async def test_login_nonexistent_user_raises(self) -> None:
        repo = make_mock_repo(get_by_email=AsyncMock(return_value=None))
        svc = AuthService(repo)
        data = LoginRequest(email="ghost@swigato.com", password="SecurePass1!")
        with pytest.raises(InvalidCredentialsError):
            await svc.login(data)

    async def test_login_unverified_email_raises(self) -> None:
        repo = make_mock_repo(
            get_by_email=AsyncMock(return_value=make_mock_user(is_email_verified=False))
        )
        svc = AuthService(repo)
        data = LoginRequest(email="user@swigato.com", password="SecurePass1!")
        with pytest.raises(Exception):  # EmailNotVerifiedError
            await svc.login(data)


@pytest.mark.asyncio
class TestAuthServiceRefreshToken:
    async def test_refresh_invalid_token_raises(self) -> None:
        repo = make_mock_repo(
            get_refresh_token_by_hash=AsyncMock(return_value=None)
        )
        svc = AuthService(repo)
        with pytest.raises(RefreshTokenInvalidError):
            await svc.refresh_access_token("invalid-token")

    async def test_refresh_expired_token_raises(self) -> None:
        expired_token = MagicMock()
        expired_token.is_valid = False
        repo = make_mock_repo(
            get_refresh_token_by_hash=AsyncMock(return_value=expired_token)
        )
        svc = AuthService(repo)
        with pytest.raises(RefreshTokenInvalidError):
            await svc.refresh_access_token("expired-token")


@pytest.mark.asyncio
class TestAuthServiceVerifyEmail:
    async def test_verify_invalid_token_raises(self) -> None:
        repo = make_mock_repo(
            get_valid_email_verification=AsyncMock(return_value=None)
        )
        svc = AuthService(repo)
        with pytest.raises(TokenInvalidError):
            await svc.verify_email("bad-token")

    async def test_verify_success_updates_user(self) -> None:
        user = make_mock_user(is_email_verified=False)
        ev = MagicMock()
        ev.user = user
        repo = make_mock_repo(
            get_valid_email_verification=AsyncMock(return_value=ev)
        )
        svc = AuthService(repo)
        await svc.verify_email("valid-token")
        repo.mark_email_verification_used.assert_called_once_with(ev)
        repo.update.assert_called_once()
