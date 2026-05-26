"""
app/api/v1/auth/register.py
───────────────────────────
Registration and email verification endpoints.
"""
from __future__ import annotations

from fastapi import APIRouter, status

from app.api.deps import AuthSvc, ClientIP
from app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    ResendVerificationRequest,
    VerifyEmailRequest,
)
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer account",
)
async def register(
    data: RegisterRequest,
    auth_svc: AuthSvc,
    client_ip: ClientIP,
) -> RegisterResponse:
    user = await auth_svc.register(data, client_ip)
    return RegisterResponse(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        is_email_verified=user.is_email_verified,
    )

@router.post(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify email address using token from email",
)
async def verify_email(
    data: VerifyEmailRequest,
    auth_svc: AuthSvc,
) -> MessageResponse:
    await auth_svc.verify_email(data.token)
    return MessageResponse(message="Email verified successfully.")

@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    summary="Resend email verification link",
)
async def resend_verification(
    data: ResendVerificationRequest,
    auth_svc: AuthSvc,
) -> MessageResponse:
    await auth_svc.resend_verification(data.email)
    return MessageResponse(message="If this email is registered and unverified, a new link has been sent.")
