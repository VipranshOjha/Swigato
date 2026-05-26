from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import Field

from app.schemas.common import AppBaseModel


# --- Menu Categories ---
class MenuCategoryBase(AppBaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class MenuCategoryCreate(MenuCategoryBase):
    pass


class MenuCategoryUpdate(AppBaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class MenuCategoryResponse(MenuCategoryBase):
    id: uuid.UUID
    restaurant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# --- Menu Items ---
class MenuItemBase(AppBaseModel):
    name: str = Field(..., max_length=150)
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    is_veg: bool = True
    is_available: bool = True
    image_url: Optional[str] = None
    spicy_level: int = Field(0, ge=0, le=5)
    preparation_time_minutes: int = Field(15, ge=0)
    dietary_tags: List[str] = Field(default_factory=list)


class MenuItemCreate(MenuItemBase):
    category_id: uuid.UUID


class MenuItemUpdate(AppBaseModel):
    category_id: Optional[uuid.UUID] = None
    name: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    is_veg: Optional[bool] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None
    spicy_level: Optional[int] = Field(None, ge=0, le=5)
    preparation_time_minutes: Optional[int] = Field(None, ge=0)
    dietary_tags: Optional[List[str]] = None


class MenuItemAvailabilityUpdate(AppBaseModel):
    is_available: bool


class MenuItemResponse(MenuItemBase):
    id: uuid.UUID
    restaurant_id: uuid.UUID
    category_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# --- Grouped Responses ---
class MenuCategoryWithItemsResponse(MenuCategoryResponse):
    items: List[MenuItemResponse] = []
