from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import Field, field_validator

from app.schemas.common import AppBaseModel
from app.schemas.user import UserPublicResponse


class ReviewCreate(AppBaseModel):
    order_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    title: Optional[str] = Field(default=None, max_length=150)
    comment: str = Field(..., min_length=10, max_length=2000, description="Minimum 10 characters")


class ReviewUpdate(AppBaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    title: Optional[str] = Field(default=None, max_length=150)
    comment: Optional[str] = Field(default=None, min_length=10, max_length=2000)


class OwnerReplyUpdate(AppBaseModel):
    owner_reply: str = Field(..., min_length=5, max_length=1000, description="Owner reply text")


class ReviewResponse(AppBaseModel):
    id: uuid.UUID
    customer_id: int
    restaurant_id: uuid.UUID
    order_id: uuid.UUID
    rating: int
    title: Optional[str] = None
    comment: str
    is_edited: bool
    is_hidden: bool
    owner_reply: Optional[str] = None
    owner_reply_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Embedded customer details for display
    customer: Optional[UserPublicResponse] = None
    
    # Extra flags
    verified_purchase: bool = True  # Always true in this system since we enforce it


class ReviewSummaryResponse(AppBaseModel):
    restaurant_id: uuid.UUID
    average_rating: float
    total_reviews: int
    five_star: int
    four_star: int
    three_star: int
    two_star: int
    one_star: int
