from __future__ import annotations

import uuid
from datetime import datetime, time
from typing import List, Optional

from pydantic import Field, HttpUrl

from app.models.restaurant import ApprovalStatus, DocumentType
from app.schemas.common import AppBaseModel


# Categories
class CategoryBase(AppBaseModel):
    name: str = Field(..., max_length=100)
    icon_url: Optional[str] = Field(None, max_length=255)

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: uuid.UUID
    slug: str


# Operating Hours
class OperatingHourBase(AppBaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0 = Monday, 6 = Sunday")
    open_time: Optional[time] = None
    close_time: Optional[time] = None
    is_closed: bool = False

class OperatingHourCreate(OperatingHourBase):
    pass

class OperatingHourResponse(OperatingHourBase):
    id: uuid.UUID


# Documents
class DocumentBase(AppBaseModel):
    document_type: DocumentType
    file_url: str

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: uuid.UUID
    verified_at: Optional[datetime] = None
    created_at: datetime


# Restaurant Base & Shared
class RestaurantBase(AppBaseModel):
    name: str = Field(..., max_length=150)
    description: Optional[str] = None
    phone: str = Field(..., max_length=20)
    email: str = Field(..., max_length=255)
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    address: str
    city: str = Field(..., max_length=100)
    state: str = Field(..., max_length=100)
    country: str = Field("India", max_length=100)
    postal_code: str = Field(..., max_length=20)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    delivery_radius_km: float = 5.0
    minimum_order_amount: float = 0.0
    base_delivery_fee: float = 0.0
    free_delivery_above: Optional[float] = None

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantUpdate(AppBaseModel):
    name: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    delivery_radius_km: Optional[float] = None
    minimum_order_amount: Optional[float] = None
    base_delivery_fee: Optional[float] = None
    free_delivery_above: Optional[float] = None
    is_open: Optional[bool] = None

class RestaurantAssetUpdate(AppBaseModel):
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None

class RestaurantApprovalUpdate(AppBaseModel):
    rejection_reason: Optional[str] = None


# Restaurant Responses
class RestaurantPublicResponse(RestaurantBase):
    """What the public sees (no sensitive admin/owner data)"""
    id: uuid.UUID
    slug: str
    is_open: bool
    categories: List[CategoryResponse] = []

class RestaurantPublicDetailResponse(RestaurantPublicResponse):
    """Public detail includes operating hours"""
    operating_hours: List[OperatingHourResponse] = []

class RestaurantOwnerResponse(RestaurantPublicDetailResponse):
    """What the owner sees (includes approval status, documents, etc.)"""
    approval_status: ApprovalStatus
    rejection_reason: Optional[str] = None
    documents: List[DocumentResponse] = []

class RestaurantAdminResponse(RestaurantOwnerResponse):
    """What the admin sees (includes owner details, verification info)"""
    owner_id: int
    verified_at: Optional[datetime] = None
    verified_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
