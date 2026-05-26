from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class MenuCategory(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "menu_categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship(back_populates="menu_categories")
    items: Mapped[List["MenuItem"]] = relationship(
        "MenuItem", back_populates="category", cascade="all, delete-orphan"
    )


class MenuItem(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "menu_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), index=True, nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("menu_categories.id", ondelete="CASCADE"), index=True, nullable=False)
    
    name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    
    is_veg: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    spicy_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    preparation_time_minutes: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    
    dietary_tags: Mapped[List[str]] = mapped_column(ARRAY(String), default=list, nullable=False)

    # Relationships
    restaurant: Mapped["Restaurant"] = relationship(back_populates="menu_items")
    category: Mapped["MenuCategory"] = relationship(back_populates="items")
