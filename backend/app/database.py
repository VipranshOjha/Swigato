"""
app/database.py
───────────────
Async SQLAlchemy 2.x engine and session factory.

REPLACES the old synchronous database.py.

Key changes from previous version:
- Sync `create_engine` → async `create_async_engine` (asyncpg driver)
- `SessionLocal` generator → `async_sessionmaker` + async context manager
- `Base = declarative_base()` REMOVED — Base lives in app/models/base.py
- `Base.metadata.create_all()` REMOVED — Alembic owns the schema
- `get_db()` sync → `get_session()` async, auto-commits/rolls back
"""
from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import Settings
from app import config

_engine = None
_async_session_factory = None


def create_engine(settings: Settings):
    kwargs: dict = {
        "echo": settings.app_debug and not settings.is_production,
        "pool_pre_ping": True,
        "pool_recycle": 1800,
    }
    if settings.is_testing:
        from sqlalchemy.pool import NullPool
        kwargs["poolclass"] = NullPool
    else:
        kwargs["pool_size"] = settings.database_pool_size
        kwargs["max_overflow"] = settings.database_max_overflow
        kwargs["pool_timeout"] = settings.database_pool_timeout

    return create_async_engine(settings.async_database_url, **kwargs)


def create_session_factory(engine):
    return async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


def init_db(settings: Settings | None = None) -> None:
    """Called once at app startup via lifespan."""
    global _engine, _async_session_factory
    if settings is None:
        settings = config.get_settings()
    _engine = create_engine(settings)
    _async_session_factory = create_session_factory(_engine)


async def close_db() -> None:
    """Called at app shutdown."""
    global _engine
    if _engine is not None:
        await _engine.dispose()
        _engine = None


import logging
logger = logging.getLogger(__name__)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Per-request async DB session. Auto-commits on success, rolls back on error."""
    if _async_session_factory is None:
        raise RuntimeError("Database not initialized. Call init_db() during app startup.")
    async with _async_session_factory() as session:
        try:
            yield session
            logger.debug("get_session: about to commit session")
            await session.commit()
            logger.debug("get_session: commit successful")
        except Exception as e:
            logger.error(f"get_session: exception occurred ({e}), rolling back")
            await session.rollback()
            raise


# Annotated alias for clean dependency injection in route handlers
DbSession = Annotated[AsyncSession, Depends(get_session)]