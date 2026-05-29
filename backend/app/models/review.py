from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class Review(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "reviews"
    __table_args__ = (
        Index("ix_reviews_restaurant_id_created_at", "restaurant_id", "created_at"),
        Index("ix_reviews_customer_id_created_at", "customer_id", "created_at"),
        Index("ix_reviews_restaurant_id_rating", "restaurant_id", "rating"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    
    # Rating & Content
    rating: Mapped[int] = mapped_column(Integer, nullable=False) # 1-5
    title: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Flags
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    moderated_by: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    
    # Owner reply
    owner_reply: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_reply_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    customer: Mapped["User"] = relationship("User", foreign_keys=[customer_id])
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="reviews")
    order: Mapped["Order"] = relationship("Order", foreign_keys=[order_id])
    moderator: Mapped[Optional["User"]] = relationship("User", foreign_keys=[moderated_by])

    def __repr__(self) -> str:
        return f"<Review {self.id} rating={self.rating}>"
