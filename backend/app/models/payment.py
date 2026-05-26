"""
app/models/payment.py
─────────────────────
Payment domain models: Payment, PaymentEvent, Refund.

Design:
- Payment tracks the lifecycle of a transaction for an Order.
- PaymentEvent provides an append-only audit trail and webhook idempotency.
- Refund tracks partial or full returns of money.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional, Any

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    customer_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Identifiers
    gateway: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_payment_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True, unique=True
    )

    # Money
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")

    # Status
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending", index=True)
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ─── Relationships ────────────────────────────────────────────────────────
    order: Mapped["Order"] = relationship("Order")
    customer: Mapped["User"] = relationship("User")
    events: Mapped[List["PaymentEvent"]] = relationship(
        "PaymentEvent",
        back_populates="payment",
        cascade="all, delete-orphan",
        order_by="PaymentEvent.created_at",
    )
    refunds: Mapped[List["Refund"]] = relationship(
        "Refund",
        back_populates="payment",
        cascade="all, delete-orphan",
        order_by="Refund.created_at",
    )

    def __repr__(self) -> str:
        return f"<Payment id={self.id} status={self.status} amount={self.amount}>"


class PaymentEvent(Base):
    """
    Append-only log of all payment events and webhooks.
    Using unique constraint on provider_event_id for idempotency.
    """
    __tablename__ = "payment_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    payment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("payments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Used for idempotency handling - each webhook event usually has a unique ID from the provider
    provider_event_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    
    raw_payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ─── Relationships ────────────────────────────────────────────────────────
    payment: Mapped["Payment"] = relationship("Payment", back_populates="events")

    def __repr__(self) -> str:
        return f"<PaymentEvent type={self.event_type}>"


class Refund(Base, TimestampMixin):
    __tablename__ = "refunds"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    payment_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("payments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    provider_refund_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")

    # ─── Relationships ────────────────────────────────────────────────────────
    payment: Mapped["Payment"] = relationship("Payment", back_populates="refunds")

    def __repr__(self) -> str:
        return f"<Refund id={self.id} amount={self.amount} status={self.status}>"
