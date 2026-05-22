"""
alembic/env.py
───────────────
Alembic async migration environment.

Uses asyncio to run migrations with asyncpg (same driver as app).
Imports all models so Alembic can detect schema changes via autogenerate.
"""
from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# ─── Import all models for autogenerate ──────────────────────────────────────
# IMPORTANT: Every new model file must be imported here
from app.models.base import Base
from app.models.user import (  # noqa: F401
    EmailVerification,
    PasswordReset,
    RefreshToken,
    Role,
    User,
    UserRole,
)
from app.models.audit import AuditLog  # noqa: F401

# ─── Alembic config ───────────────────────────────────────────────────────────
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Override URL from app settings (reads .env)
from app.config import get_settings
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url)

target_metadata = Base.metadata


# ─── Offline migrations (generates SQL, no DB connection) ─────────────────────
def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


# ─── Online migrations (connects to DB) ──────────────────────────────────────
def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
