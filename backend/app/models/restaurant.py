from __future__ import annotations

import enum
import uuid
from datetime import datetime, time
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin


class ApprovalStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class DocumentType(str, enum.Enum):
    FSSAI = "FSSAI"
    GST = "GST"
    PAN = "PAN"
    BANK_PROOF = "BANK_PROOF"
    OWNER_ID = "OWNER_ID"


# Association table for Many-to-Many relationship between Restaurant and Category
restaurant_category_mapping = Table(
    "restaurant_category_mappings",
    Base.metadata,
    Column("restaurant_id", ForeignKey("restaurants.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", ForeignKey("restaurant_categories.id", ondelete="CASCADE"), primary_key=True),
)


class RestaurantCategory(Base, TimestampMixin):
    __tablename__ = "restaurant_categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    icon_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    restaurants: Mapped[List["Restaurant"]] = relationship(
        secondary=restaurant_category_mapping,
        back_populates="categories",
    )


class Restaurant(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "restaurants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    
    # Basic Info
    name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Assets
    logo_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Address Info
    address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="India", nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    
    # Delivery Config
    delivery_radius_km: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    minimum_order_amount: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0, nullable=False)
    base_delivery_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0.0, nullable=False)
    free_delivery_above: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    
    # Status
    is_open: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    approval_status: Mapped[ApprovalStatus] = mapped_column(
        Enum(ApprovalStatus, name="approval_status_enum"),
        default=ApprovalStatus.DRAFT,
        index=True,
        nullable=False,
    )
    
    # Approval Workflow
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    owner: Mapped["User"] = relationship(foreign_keys=[owner_id])
    verifier: Mapped[Optional["User"]] = relationship(foreign_keys=[verified_by])
    categories: Mapped[List["RestaurantCategory"]] = relationship(
        secondary=restaurant_category_mapping,
        back_populates="restaurants",
    )
    operating_hours: Mapped[List["OperatingHour"]] = relationship(
        "OperatingHour", back_populates="restaurant", cascade="all, delete-orphan"
    )
    documents: Mapped[List["RestaurantDocument"]] = relationship(
        "RestaurantDocument", back_populates="restaurant", cascade="all, delete-orphan"
    )


class OperatingHour(Base, TimestampMixin):
    __tablename__ = "operating_hours"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), index=True, nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0 = Monday, 6 = Sunday
    open_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    close_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    restaurant: Mapped["Restaurant"] = relationship(back_populates="operating_hours")


class RestaurantDocument(Base, TimestampMixin):
    __tablename__ = "restaurant_documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), index=True, nullable=False)
    document_type: Mapped[DocumentType] = mapped_column(Enum(DocumentType, name="document_type_enum"), nullable=False)
    file_url: Mapped[str] = mapped_column(String(255), nullable=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    restaurant: Mapped["Restaurant"] = relationship(back_populates="documents")
