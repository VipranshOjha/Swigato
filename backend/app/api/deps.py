"""
app/api/deps.py
────────────────
Shared FastAPI dependency providers.

These are thin wrappers that wire together:
- DB session (from database.py)
- Repository instances
- Service instances
- Auth context

Using Depends() injection means every component is:
- Testable (swap with mocks in tests)
- Decoupled (api → service → repo — no circular imports)
- Automatically scoped per request
"""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Request

from app.database import DbSession
from app.repositories.user_repo import UserRepository
from app.services.auth_service import AuthService


# ─── Repositories ────────────────────────────────────────────────────────────

def get_user_repository(session: DbSession) -> UserRepository:
    return UserRepository(session)


UserRepo = Annotated[UserRepository, Depends(get_user_repository)]


# ─── Services ─────────────────────────────────────────────────────────────────

def get_auth_service(user_repo: UserRepo) -> AuthService:
    return AuthService(user_repo)


AuthSvc = Annotated[AuthService, Depends(get_auth_service)]


# ─── Request context ─────────────────────────────────────────────────────────

def get_client_ip(request: Request) -> str | None:
    """Extract real client IP (supports X-Forwarded-For from reverse proxy)."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else None


ClientIP = Annotated[str | None, Depends(get_client_ip)]
