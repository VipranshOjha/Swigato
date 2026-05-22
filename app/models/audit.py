"""
app/models/audit.py
────────────────────
Audit log model — immutable record of admin and sensitive actions.

Design:
- Append-only: never update or delete audit logs
- Captures: who did what to which entity, before/after state
- Used for: compliance, debugging, dispute resolution
- indexed on (entity_type, entity_id) and (actor_id) for efficient queries
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_logs_entity", "entity_type", "entity_id"),
        Index("idx_audit_logs_actor", "actor_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # Who performed the action
    actor_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    actor_role: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # What action was performed
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Which entity was affected
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    # State change
    old_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Request context
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Extra metadata (e.g. reason for suspension)
    metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # ─── Relationships ────────────────────────────────────────────────────────
    actor = relationship("User", foreign_keys=[actor_id])

    def __repr__(self) -> str:
        return f"<AuditLog action={self.action!r} entity={self.entity_type}:{self.entity_id}>"
