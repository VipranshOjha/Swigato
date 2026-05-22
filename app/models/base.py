"""
app/models/base.py
──────────────────
SQLAlchemy declarative base and reusable mixins.

TimestampMixin: created_at / updated_at auto-maintained by SQLAlchemy events.
SoftDeleteMixin: deleted_at for soft-delete pattern.
"""
from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative base for all SQLAlchemy models."""
    pass


class TimestampMixin:
    """
    Adds created_at and updated_at to any model.
    updated_at is maintained automatically by onupdate.
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SoftDeleteMixin:
    """
    Adds deleted_at for soft-delete pattern.
    Soft-deleted records remain in DB for audit/recovery but are
    excluded from queries via filter(deleted_at.is_(None)).
    """
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

    def soft_delete(self) -> None:
        self.deleted_at = datetime.now(UTC)
