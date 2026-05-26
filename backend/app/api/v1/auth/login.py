"""
app/api/v1/auth/login.py
────────────────────────
Login and session endpoints.
"""
from __future__ import annotations

from datetime import timedelta

from fastapi import APIRouter, Cookie, Request, Response, status

from app.api.deps import AuthSvc, ClientIP
from app.config import get_settings
from app.dependencies.auth import AuthUser
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshTokenRequest,
    TokenResponse,
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
        secure=settings.is_production,
        samesite="lax",
        path="/api/v1/auth",
    )

def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE_KEY, path="/api/v1/auth")

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
    refresh_token_cookie: str | None = Cookie(default=None, alias=REFRESH_COOKIE_KEY),
) -> TokenResponse:
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
