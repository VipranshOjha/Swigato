"""
app/main.py
────────────
FastAPI application factory with async lifespan.

REPLACES the old synchronous main.py which:
- Used `Base.metadata.create_all(bind=engine)` at import time  ← REMOVED
- Used sync engine                                              ← REMOVED
- Had no middleware, no error handlers, no health checks

Now:
- Async lifespan handles DB + Redis init/shutdown
- Alembic owns schema (no create_all)
- ORJSON for faster JSON serialization
- Structured middleware stack
- /health and /ready endpoints for load balancers
- API docs hidden in production
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

from app.api.v1.router import api_router
from app import config
from app.core.exceptions import register_exception_handlers
from app.core.middleware import register_middleware
from app.database import close_db, init_db
from app.redis import close_redis, init_redis

logger = structlog.get_logger(__name__)


async def _seed_roles() -> None:
    """Ensure all system roles exist. Idempotent — safe every startup."""
    from app.constants import UserRole
    from app.database import _async_session_factory
    from app.models.user import Role
    from sqlalchemy import select

    if _async_session_factory is None:
        return

    role_descriptions = {
        UserRole.CUSTOMER: "End customer who places orders",
        UserRole.RESTAURANT_OWNER: "Owns and manages a restaurant",
        UserRole.DELIVERY_PARTNER: "Handles order pickups and deliveries",
        UserRole.ADMIN: "Platform administrator",
        UserRole.SUPER_ADMIN: "Unrestricted platform access",
    }

    async with _async_session_factory() as session:
        for role_name, description in role_descriptions.items():
            existing = await session.scalar(
                select(Role).where(Role.name == role_name.value)
            )
            if not existing:
                session.add(Role(name=role_name.value, description=description))
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = config.get_settings()
    await logger.ainfo("app_starting", env=settings.app_env, version=settings.app_version)

    init_db(settings)
    init_redis()
    await _seed_roles()

    await logger.ainfo("app_ready")
    yield

    await logger.ainfo("app_shutting_down")
    await close_db()
    await close_redis()


def create_app() -> FastAPI:
    settings = config.get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Production-grade food delivery platform API",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json" if not settings.is_production else None,
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

    register_middleware(app)
    register_exception_handlers(app)
    app.include_router(api_router)

    @app.get("/", tags=["System"], include_in_schema=False)
    async def root() -> dict:
        return {"message": "Swigato API running", "version": settings.app_version}

    @app.get("/health", tags=["System"], include_in_schema=False)
    async def health() -> dict:
        return {"status": "ok", "version": settings.app_version}

    @app.get("/ready", tags=["System"], include_in_schema=False)
    async def readiness() -> dict:
        """DB and Redis connectivity check for load balancers."""
        from app.database import _engine
        from app.redis import get_cache
        import sqlalchemy

        checks = {"database": False, "redis": False}
        try:
            async with _engine.connect() as conn:
                await conn.execute(sqlalchemy.text("SELECT 1"))
            checks["database"] = True
        except Exception:
            pass
        try:
            await get_cache().ping()
            checks["redis"] = True
        except Exception:
            pass

        return {
            "status": "ready" if all(checks.values()) else "degraded",
            "checks": checks,
        }

    return app


app = create_app()