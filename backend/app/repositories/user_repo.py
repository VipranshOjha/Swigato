"""
app/repositories/user_repo.py
──────────────────────────────
User domain repository — all DB queries for users, roles, tokens.

No business logic here.
Every method is a focused DB query.
"""
from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload

from app.models.user import (
    EmailVerification,
    PasswordReset,
    RefreshToken,
    Role,
    User,
    UserRole,
)
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    # User lookups

    async def get_by_id_with_roles(self, user_id: int) -> User | None:
        """Fetch user with roles eagerly loaded (avoids N+1)."""
        stmt = (
            select(User)
            .where(User.id == user_id, User.deleted_at.is_(None))
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        stmt = (
            select(User)
            .where(User.email == email.lower(), User.deleted_at.is_(None))
            .options(selectinload(User.user_roles).selectinload(UserRole.role))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> User | None:
        stmt = select(User).where(User.phone == phone, User.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_referral_code(self, code: str) -> User | None:
        stmt = select(User).where(User.referral_code == code.upper())
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        from sqlalchemy import func
        stmt = select(func.count()).select_from(User).where(User.email == email.lower())
        count = await self.session.scalar(stmt)
        return (count or 0) > 0

    async def phone_exists(self, phone: str) -> bool:
        from sqlalchemy import func
        stmt = select(func.count()).select_from(User).where(User.phone == phone)
        count = await self.session.scalar(stmt)
        return (count or 0) > 0

    # Role management

    async def get_role_by_name(self, name: str) -> Role | None:
        stmt = select(Role).where(Role.name == name)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def add_role(self, user: User, role: Role) -> None:
        user_role = UserRole(user_id=user.id, role_id=role.id)
        self.session.add(user_role)
        await self.session.flush()

    async def remove_role(self, user_id: int, role_name: str) -> None:
        role = await self.get_role_by_name(role_name)
        if role:
            stmt = select(UserRole).where(
                UserRole.user_id == user_id,
                UserRole.role_id == role.id,
            )
            result = await self.session.execute(stmt)
            user_role = result.scalar_one_or_none()
            if user_role:
                await self.session.delete(user_role)
                await self.session.flush()

    # Refresh Token management

    async def create_refresh_token(
        self,
        user_id: int,
        token_hash: str,
        expires_at: datetime,
        device_info: dict | None = None,
    ) -> RefreshToken:
        rt = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            device_info=device_info,
        )
        self.session.add(rt)
        await self.session.flush()
        return rt

    async def get_refresh_token_by_hash(self, token_hash: str) -> RefreshToken | None:
        stmt = (
            select(RefreshToken)
            .where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(UTC),
            )
            .options(selectinload(RefreshToken.user)
                     .selectinload(User.user_roles)
                     .selectinload(UserRole.role))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_refresh_token(self, token: RefreshToken) -> None:
        token.revoked_at = datetime.now(UTC)
        await self.session.flush()

    async def revoke_all_refresh_tokens(self, user_id: int) -> None:
        """Revoke all active refresh tokens — used for 'logout all devices'."""
        stmt = select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
        result = await self.session.execute(stmt)
        tokens = result.scalars().all()
        now = datetime.now(UTC)
        for token in tokens:
            token.revoked_at = now
        await self.session.flush()

    # Email Verification

    async def create_email_verification(
        self, user_id: int, token: str, expires_at: datetime
    ) -> EmailVerification:
        ev = EmailVerification(user_id=user_id, token=token, expires_at=expires_at)
        self.session.add(ev)
        await self.session.flush()
        return ev

    async def get_valid_email_verification(self, token: str) -> EmailVerification | None:
        stmt = select(EmailVerification).where(
            EmailVerification.token == token,
            EmailVerification.used_at.is_(None),
            EmailVerification.expires_at > datetime.now(UTC),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def mark_email_verification_used(self, ev: EmailVerification) -> None:
        ev.used_at = datetime.now(UTC)
        await self.session.flush()

    # Password Reset

    async def create_password_reset(
        self, user_id: int, token: str, expires_at: datetime, ip: str | None = None
    ) -> PasswordReset:
        pr = PasswordReset(user_id=user_id, token=token, expires_at=expires_at, ip_address=ip)
        self.session.add(pr)
        await self.session.flush()
        return pr

    async def get_valid_password_reset(self, token: str) -> PasswordReset | None:
        stmt = select(PasswordReset).where(
            PasswordReset.token == token,
            PasswordReset.used_at.is_(None),
            PasswordReset.expires_at > datetime.now(UTC),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def mark_password_reset_used(self, pr: PasswordReset) -> None:
        pr.used_at = datetime.now(UTC)
        await self.session.flush()
