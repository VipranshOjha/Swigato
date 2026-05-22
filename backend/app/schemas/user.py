"""
app/schemas/user.py
────────────────────
Pydantic v2 schemas for user profile responses.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.common import AppBaseModel


class UserPublicResponse(AppBaseModel):
    """Minimal user info shown to other users (e.g. review author)."""
    id: int
    first_name: str
    last_name: str
    avatar_url: str | None


class UserMeResponse(AppBaseModel):
    """Full authenticated user profile — returned for /users/me."""
    id: int
    first_name: str
    last_name: str
    email: str
    phone: str | None
    is_active: bool
    is_email_verified: bool
    email_verified_at: datetime | None
    avatar_url: str | None
    referral_code: str | None
    roles: list[str]
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_user(cls, user) -> "UserMeResponse":
        return cls(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone=user.phone,
            is_active=user.is_active,
            is_email_verified=user.is_email_verified,
            email_verified_at=user.email_verified_at,
            avatar_url=user.avatar_url,
            referral_code=user.referral_code,
            roles=user.role_names,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


class UpdateProfileRequest(AppBaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, pattern=r"^\+?[1-9]\d{7,14}$")
