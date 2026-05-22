"""
app/schemas/auth.py
────────────────────
Pydantic v2 schemas for authentication endpoints.

Conventions:
- *Request schemas: inbound data, strict validation
- *Response schemas: outbound data, computed from ORM models
- Passwords are validated for complexity here (not in the model)
- Sensitive fields (password_hash) never appear in response schemas
"""
from __future__ import annotations

import re
from datetime import datetime

from pydantic import EmailStr, Field, field_validator, model_validator

from app.schemas.common import AppBaseModel


# ─── Registration ─────────────────────────────────────────────────────────────

class RegisterRequest(AppBaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, pattern=r"^\+?[1-9]\d{7,14}$")
    password: str = Field(min_length=8, max_length=128)
    referral_code: str | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def strip_and_capitalize(cls, v: str) -> str:
        return v.strip().title()

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        """
        Enforce: min 8 chars, at least one uppercase, one digit, one special char.
        Keeps the logic centralized — easy to adjust policy.
        """
        errors = []
        if not re.search(r"[A-Z]", v):
            errors.append("at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            errors.append("at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            errors.append("at least one special character")
        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")
        return v


class RegisterResponse(AppBaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    is_email_verified: bool
    message: str = "Registration successful. Please verify your email."


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginRequest(AppBaseModel):
    email: EmailStr
    password: str
    device_info: dict | None = None  # Optional: user-agent, device name for refresh token


class TokenResponse(AppBaseModel):
    """
    Returned on successful login or token refresh.
    refresh_token is set as an HttpOnly cookie in the response headers
    by the route handler — not included in JSON body for security.
    """
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until access token expiry


# ─── Refresh ──────────────────────────────────────────────────────────────────

class RefreshTokenRequest(AppBaseModel):
    """
    The refresh token can be sent either as a cookie (preferred)
    or in the request body (for non-browser clients).
    """
    refresh_token: str | None = None  # From body; if None, look in cookie


# ─── Logout ───────────────────────────────────────────────────────────────────

class LogoutRequest(AppBaseModel):
    logout_all_devices: bool = False  # Revoke ALL refresh tokens for the user


# ─── Email Verification ───────────────────────────────────────────────────────

class VerifyEmailRequest(AppBaseModel):
    token: str


class ResendVerificationRequest(AppBaseModel):
    email: EmailStr


# ─── Password Reset ───────────────────────────────────────────────────────────

class ForgotPasswordRequest(AppBaseModel):
    email: EmailStr


class ResetPasswordRequest(AppBaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self

    @field_validator("new_password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        errors = []
        if not re.search(r"[A-Z]", v):
            errors.append("at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            errors.append("at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            errors.append("at least one special character")
        if errors:
            raise ValueError(f"Password must contain: {', '.join(errors)}")
        return v


class ChangePasswordRequest(AppBaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        if self.new_password == self.current_password:
            raise ValueError("New password must differ from current password.")
        return self
