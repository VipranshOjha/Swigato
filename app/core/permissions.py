"""
app/core/permissions.py
────────────────────────
Role-based access control (RBAC) via FastAPI dependency injection.

Design:
- Permissions are enforced at the API layer via Depends()
- No business logic here — only "can this user attempt this action?"
- Fine-grained resource ownership checks (e.g. "does this user own this restaurant?")
  are done in service layer after loading the resource
"""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.constants import UserRole
from app.core.exceptions import (
    AccountSuspendedError,
    EmailNotVerifiedError,
    PermissionDeniedError,
    TokenInvalidError,
)
from app.core.security import decode_access_token
from app.redis import get_cache

# HTTPBearer parses the Authorization: Bearer <token> header
_bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser:
    """Lightweight user context extracted from JWT — no DB query needed."""

    def __init__(self, payload: dict):
        self.id: int = int(payload["sub"])
        self.roles: list[str] = payload.get("roles", [])
        self.jti: str = payload.get("jti", "")
        self.is_active: bool = payload.get("is_active", True)
        self.is_email_verified: bool = payload.get("is_email_verified", False)

    def has_role(self, *roles: str) -> bool:
        return any(r in self.roles for r in roles)

    def is_admin(self) -> bool:
        return self.has_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)


async def _get_token_from_header(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> str:
    if credentials is None:
        raise TokenInvalidError("Authorization header missing.")
    return credentials.credentials


async def get_current_user(
    token: str = Depends(_get_token_from_header),
) -> CurrentUser:
    """
    Core auth dependency.
    1. Decodes JWT and validates signature/expiry
    2. Checks the jti against Redis blacklist (handles logout)
    3. Returns a CurrentUser object

    Raises: TokenInvalidError, TokenExpiredError
    """
    payload = decode_access_token(token)

    # Check Redis blacklist — O(1) lookup
    jti = payload.get("jti", "")
    cache = get_cache()
    is_blacklisted = await cache.exists(f"jwt_blacklist:{jti}")
    if is_blacklisted:
        raise TokenInvalidError("Token has been revoked.")

    user = CurrentUser(payload)

    if not user.is_active:
        raise AccountSuspendedError()

    return user


async def get_current_verified_user(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """Requires email verification in addition to authentication."""
    if not user.is_email_verified:
        raise EmailNotVerifiedError()
    return user


def require_roles(*roles: UserRole):
    """
    Dependency factory that enforces role-based access.

    Usage:
        @router.post("/admin/approve")
        async def approve(
            _: None = Depends(require_roles(UserRole.ADMIN))
        ): ...
    """
    role_strs = [r.value for r in roles]

    async def checker(
        user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if not user.has_role(*role_strs):
            raise PermissionDeniedError(
                f"Requires one of: {', '.join(role_strs)}"
            )
        return user

    return checker


def require_verified_roles(*roles: UserRole):
    """Same as require_roles but also enforces email verification."""
    role_strs = [r.value for r in roles]

    async def checker(
        user: CurrentUser = Depends(get_current_verified_user),
    ) -> CurrentUser:
        if not user.has_role(*role_strs):
            raise PermissionDeniedError(
                f"Requires one of: {', '.join(role_strs)}"
            )
        return user

    return checker


# ─── Annotated type aliases for clean endpoint signatures ─────────────────────

AuthUser = Annotated[CurrentUser, Depends(get_current_user)]
VerifiedUser = Annotated[CurrentUser, Depends(get_current_verified_user)]
AdminUser = Annotated[CurrentUser, Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))]
