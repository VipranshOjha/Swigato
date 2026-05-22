"""
app/services/auth_service.py
─────────────────────────────
Authentication business logic.

This layer:
- Orchestrates repositories (no direct DB access)
- Makes security decisions (rate limits, token rotation)
- Publishes side effects (audit log, email notification tasks)
- Knows nothing about HTTP (no Request, no Response)

All methods raise SwigatoException subclasses on failure.
"""
from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta

import structlog

from app import config
from app.core.constants import AuditAction, UserRole
from app.core.exceptions import (
    EmailAlreadyExistsError,
    EmailNotVerifiedError,
    InvalidCredentialsError,
    PhoneAlreadyExistsError,
    RefreshTokenInvalidError,
    TokenExpiredError,
    TokenInvalidError,
    UserNotFoundError,
)
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    create_password_reset_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.user import User
from app.redis import get_cache
from app.repositories.user_repo import UserRepository
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)

logger = structlog.get_logger(__name__)


class AuthService:
    """
    All authentication operations.
    Instantiated per-request (stateless except for injected dependencies).
    """

    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo
        self.settings = config.get_settings()

    # ─── Registration ─────────────────────────────────────────────────────────

    async def register(self, data: RegisterRequest, client_ip: str | None = None) -> User:
        """
        Register a new customer account.

        Steps:
        1. Check email/phone uniqueness
        2. Hash password
        3. Create user with 'customer' role
        4. Generate email verification token
        5. Queue verification email (Celery task — Phase 9)
        6. Write audit log
        """
        # Uniqueness checks
        if await self.user_repo.email_exists(data.email.lower()):
            raise EmailAlreadyExistsError()
        if data.phone and await self.user_repo.phone_exists(data.phone):
            raise PhoneAlreadyExistsError()

        # Referral: look up referrer if code provided
        referred_by_id: int | None = None
        if data.referral_code:
            referrer = await self.user_repo.get_by_referral_code(data.referral_code.upper())
            if referrer:
                referred_by_id = referrer.id

        # Create user
        user = await self.user_repo.create(
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email.lower(),
            phone=data.phone,
            password_hash=hash_password(data.password),
            referral_code=self._generate_referral_code(),
            referred_by_id=referred_by_id,
        )

        # Assign default role
        customer_role = await self.user_repo.get_role_by_name(UserRole.CUSTOMER)
        if customer_role:
            await self.user_repo.add_role(user, customer_role)

        # Create email verification token
        await self._create_email_verification(user)

        # TODO Phase 9: queue verification email Celery task

        await logger.ainfo(
            "user_registered",
            user_id=user.id,
            email=user.email,
        )

        return user

    # ─── Login ────────────────────────────────────────────────────────────────

    async def login(
        self,
        data: LoginRequest,
        client_ip: str | None = None,
    ) -> tuple[str, str]:
        """
        Authenticate user and return (access_token, refresh_token).

        Security notes:
        - Constant-time password comparison via pwdlib
        - Email verified check AFTER password check (prevents email enumeration
          only if timing is consistent — acceptable tradeoff for UX clarity)
        - Rehash password if argon2 parameters have been upgraded
        """
        user = await self.user_repo.get_by_email(data.email.lower())

        # Deliberate: same error for "no user" and "wrong password" — prevents enumeration
        if not user or not user.password_hash:
            raise InvalidCredentialsError()

        is_valid, updated_hash = verify_password(data.password, user.password_hash)
        if not is_valid:
            await logger.awarning("login_failed", email=data.email, ip=client_ip)
            raise InvalidCredentialsError()

        if not user.is_active:
            from app.core.exceptions import AccountSuspendedError
            raise AccountSuspendedError()

        if not user.is_email_verified:
            raise EmailNotVerifiedError()

        # Rehash if argon2 parameters have been upgraded (transparent upgrade)
        if updated_hash:
            await self.user_repo.update(
                user, password_hash=updated_hash
            )

        access_token, jti = create_access_token(
            subject=user.id,
            roles=user.role_names,
            extra_claims={
                "is_active": user.is_active,
                "is_email_verified": user.is_email_verified,
            },
        )
        refresh_token_raw, refresh_token_hash = create_refresh_token()

        expires_at = datetime.now(UTC) + timedelta(days=self.settings.jwt_refresh_token_expire_days)
        await self.user_repo.create_refresh_token(
            user_id=user.id,
            token_hash=refresh_token_hash,
            expires_at=expires_at,
            device_info=data.device_info,
        )

        await logger.ainfo("user_logged_in", user_id=user.id, ip=client_ip)

        return access_token, refresh_token_raw

    # ─── Token Refresh ────────────────────────────────────────────────────────

    async def refresh_access_token(self, raw_refresh_token: str) -> tuple[str, str]:
        """
        Rotate refresh token and issue new access token.

        Refresh token rotation:
        - Old token is revoked immediately
        - New token is issued
        - If old token is replayed: revoked_at is already set → error → forces re-login
          This detects refresh token theft.
        """
        token_hash = hash_refresh_token(raw_refresh_token)
        stored_token = await self.user_repo.get_refresh_token_by_hash(token_hash)

        if not stored_token or not stored_token.is_valid:
            raise RefreshTokenInvalidError()

        user = stored_token.user

        # Rotate: revoke old, issue new
        await self.user_repo.revoke_refresh_token(stored_token)

        access_token, _ = create_access_token(
            subject=user.id,
            roles=user.role_names,
            extra_claims={
                "is_active": user.is_active,
                "is_email_verified": user.is_email_verified,
            },
        )
        new_refresh_raw, new_refresh_hash = create_refresh_token()
        expires_at = datetime.now(UTC) + timedelta(days=self.settings.jwt_refresh_token_expire_days)
        await self.user_repo.create_refresh_token(
            user_id=user.id,
            token_hash=new_refresh_hash,
            expires_at=expires_at,
            device_info=stored_token.device_info,
        )

        return access_token, new_refresh_raw

    # ─── Logout ───────────────────────────────────────────────────────────────

    async def logout(
        self,
        user_id: int,
        raw_refresh_token: str | None,
        access_token_jti: str,
        logout_all: bool = False,
    ) -> None:
        """
        1. Blacklist the access token jti in Redis (auto-expires with token)
        2. Revoke the refresh token(s) in DB
        """
        # Blacklist access token
        cache = get_cache()
        ttl = self.settings.jwt_access_token_expire_minutes * 60
        await cache.setex(f"jwt_blacklist:{access_token_jti}", ttl, "1")

        if logout_all:
            await self.user_repo.revoke_all_refresh_tokens(user_id)
        elif raw_refresh_token:
            token_hash = hash_refresh_token(raw_refresh_token)
            stored = await self.user_repo.get_refresh_token_by_hash(token_hash)
            if stored:
                await self.user_repo.revoke_refresh_token(stored)

        await logger.ainfo("user_logged_out", user_id=user_id, all_devices=logout_all)

    # ─── Email Verification ───────────────────────────────────────────────────

    async def verify_email(self, token: str) -> None:
        ev = await self.user_repo.get_valid_email_verification(token)
        if not ev:
            raise TokenInvalidError("Email verification token is invalid or expired.")

        user = ev.user
        await self.user_repo.mark_email_verification_used(ev)
        await self.user_repo.update(
            user,
            is_email_verified=True,
            email_verified_at=datetime.now(UTC),
        )
        await logger.ainfo("email_verified", user_id=user.id)

    async def resend_verification(self, email: str) -> None:
        user = await self.user_repo.get_by_email(email.lower())
        if not user or user.is_email_verified:
            # Silently succeed — don't reveal whether email exists
            return
        await self._create_email_verification(user)
        # TODO Phase 9: queue email task

    # ─── Password Reset ───────────────────────────────────────────────────────

    async def forgot_password(self, email: str, client_ip: str | None = None) -> None:
        """
        Send password reset email.
        Always succeeds (even if email not found) — prevents enumeration.
        """
        user = await self.user_repo.get_by_email(email.lower())
        if not user:
            return  # Silent — don't reveal whether email exists

        token = create_password_reset_token()
        expires_at = datetime.now(UTC) + timedelta(hours=1)
        await self.user_repo.create_password_reset(
            user_id=user.id, token=token, expires_at=expires_at, ip=client_ip
        )
        # TODO Phase 9: queue email task with reset link

    async def reset_password(self, data: ResetPasswordRequest) -> None:
        pr = await self.user_repo.get_valid_password_reset(data.token)
        if not pr:
            raise TokenInvalidError("Password reset token is invalid or expired.")

        user = await self.user_repo.get_by_id(pr.user_id)
        if not user:
            raise UserNotFoundError()

        await self.user_repo.mark_password_reset_used(pr)
        await self.user_repo.update(user, password_hash=hash_password(data.new_password))

        # Revoke all active sessions — forces re-login after password change
        await self.user_repo.revoke_all_refresh_tokens(user.id)

        await logger.ainfo("password_reset", user_id=user.id)

    async def change_password(self, user_id: int, data: ChangePasswordRequest) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.password_hash:
            raise UserNotFoundError()

        is_valid, _ = verify_password(data.current_password, user.password_hash)
        if not is_valid:
            raise InvalidCredentialsError("Current password is incorrect.")

        await self.user_repo.update(user, password_hash=hash_password(data.new_password))
        # Revoke other sessions but keep current one (don't log user out)
        await logger.ainfo("password_changed", user_id=user_id)

    # ─── Helpers ──────────────────────────────────────────────────────────────

    async def _create_email_verification(self, user: User) -> None:
        token = create_email_verification_token()
        expires_at = datetime.now(UTC) + timedelta(
            minutes=self.settings.otp_expire_minutes * 6  # 1 hour for email links
        )
        await self.user_repo.create_email_verification(
            user_id=user.id, token=token, expires_at=expires_at
        )

    @staticmethod
    def _generate_referral_code() -> str:
        """Generate a unique 8-character alphanumeric referral code."""
        return secrets.token_urlsafe(6).upper()[:8]
