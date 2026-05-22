"""
app/api/v1/auth.py
───────────────────
Authentication endpoints.

Design:
- Refresh tokens are sent as HttpOnly cookies (not in JSON body)
  to prevent XSS theft. Non-browser clients can also send them in body.
- All endpoints return consistent JSON using the shared exception handlers.
- No business logic here — all delegated to AuthService.
"""
from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Cookie, Request, Response, status

from app.api.deps import AuthSvc, ClientIP
from app.config import get_settings
from app.core.permissions import AuthUser
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    ResendVerificationRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.common import MessageResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

REFRESH_COOKIE_KEY = "refresh_token"


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Set refresh token as HttpOnly, Secure, SameSite=Lax cookie."""
    settings = get_settings()
    max_age = int(timedelta(days=settings.jwt_refresh_token_expire_days).total_seconds())
    response.set_cookie(
        key=REFRESH_COOKIE_KEY,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.is_production,  # Secure only in production (HTTPS)
        samesite="lax",
        path="/api/v1/auth",  # Restrict cookie scope
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE_KEY, path="/api/v1/auth")


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
    "/login",
    response_model=TokenResponse,
    summary="Login and receive access + refresh tokens",
)
async def login(
    data: LoginRequest,
    auth_svc: AuthSvc,
    client_ip: ClientIP,
    response: Response,
) -> TokenResponse:
    access_token, refresh_token = await auth_svc.login(data, client_ip)
    _set_refresh_cookie(response, refresh_token)

    settings = get_settings()
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token using refresh token",
)
async def refresh(
    auth_svc: AuthSvc,
    response: Response,
    body: RefreshTokenRequest | None = None,
    # Also accept from HttpOnly cookie (browser clients)
    refresh_token_cookie: str | None = Cookie(default=None, alias=REFRESH_COOKIE_KEY),
) -> TokenResponse:
    # Prefer body token (API clients), fallback to cookie (browser clients)
    raw_token = (body.refresh_token if body else None) or refresh_token_cookie
    if not raw_token:
        from app.core.exceptions import RefreshTokenInvalidError
        raise RefreshTokenInvalidError("No refresh token provided.")

    access_token, new_refresh_token = await auth_svc.refresh_access_token(raw_token)
    _set_refresh_cookie(response, new_refresh_token)

    settings = get_settings()
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.jwt_access_token_expire_minutes * 60,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout (revoke refresh token)",
)
async def logout(
    current_user: AuthUser,
    auth_svc: AuthSvc,
    response: Response,
    request: Request,
    body: LogoutRequest | None = None,
    refresh_token_cookie: str | None = Cookie(default=None, alias=REFRESH_COOKIE_KEY),
) -> MessageResponse:
    # Get jti from request state (set by permissions.get_current_user)
    # We need the raw token to find jti — decode it again
    from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
    auth_header = request.headers.get("Authorization", "")
    jti = current_user.jti

    raw_refresh = (body.refresh_token if body else None) or refresh_token_cookie
    logout_all = body.logout_all_devices if body else False

    await auth_svc.logout(
        user_id=current_user.id,
        raw_refresh_token=raw_refresh,
        access_token_jti=jti,
        logout_all=logout_all,
    )
    _clear_refresh_cookie(response)

    msg = "Logged out from all devices." if logout_all else "Logged out successfully."
    return MessageResponse(message=msg)


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
    # Always return success — don't reveal if email exists
    return MessageResponse(message="If this email is registered and unverified, a new link has been sent.")


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
