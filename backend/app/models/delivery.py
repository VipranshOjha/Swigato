"""
app/models/delivery.py
──────────────────────
Delivery domain models: DeliveryPartnerProfile, DeliveryLocationLog.

Design:
- DeliveryPartnerProfile is 1:1 with User (users with delivery_partner role)
- Profile stores vehicle info, online/available status, location, and ratings
- DeliveryLocationLog is append-only for historical GPS tracking
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class DeliveryPartnerProfile(Base, TimestampMixin):
    __tablename__ = "delivery_partner_profiles"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Contact
    phone: Mapped[str] = mapped_column(String(20), nullable=False)

    # Vehicle
    vehicle_type: Mapped[str] = mapped_column(String(50), nullable=False)
    vehicle_number: Mapped[str] = mapped_column(String(30), nullable=False)

    # Status flags
    is_online: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_suspended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Location (last known)
    current_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Stats
    rating: Mapped[float] = mapped_column(Numeric(3, 2), nullable=False, default=5.00)
    total_deliveries: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_earnings: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.0)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

    def __repr__(self) -> str:
        return f"<DeliveryPartnerProfile user_id={self.user_id} online={self.is_online}>"


class DeliveryLocationLog(Base):
    __tablename__ = "delivery_location_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    delivery_partner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("delivery_partner_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    delivery_partner: Mapped["DeliveryPartnerProfile"] = relationship(
        "DeliveryPartnerProfile", foreign_keys=[delivery_partner_id]
    )

    def __repr__(self) -> str:
        return f"<DeliveryLocationLog partner={self.delivery_partner_id} lat={self.latitude}>"
