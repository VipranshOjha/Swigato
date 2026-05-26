"""
app/api/v1/auth/password.py
───────────────────────────
Password reset and change endpoints.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import AuthSvc, ClientIP
from app.dependencies.auth import AuthUser
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password reset email",
)
async def forgot_password(
    data: ForgotPasswordRequest,
    auth_svc: AuthSvc,
    client_ip: ClientIP,
) -> MessageResponse:
    await auth_svc.forgot_password(data.email, client_ip)
    return MessageResponse(message="If this email is registered, a password reset link has been sent.")

@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using token from email",
)
async def reset_password(
    data: ResetPasswordRequest,
    auth_svc: AuthSvc,
) -> MessageResponse:
    await auth_svc.reset_password(data)
    return MessageResponse(message="Password reset successfully. Please log in again.")

@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change password (authenticated)",
)
async def change_password(
    data: ChangePasswordRequest,
    current_user: AuthUser,
    auth_svc: AuthSvc,
) -> MessageResponse:
    await auth_svc.change_password(current_user.id, data)
    return MessageResponse(message="Password changed successfully.")
