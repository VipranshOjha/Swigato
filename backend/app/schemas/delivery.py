"""
app/schemas/delivery.py
───────────────────────
Pydantic v2 request/response schemas for the Delivery domain.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import AppBaseModel


# Request DTOs

class DeliveryPartnerRegister(AppBaseModel):
    """Register as a delivery partner."""
    phone: str = Field(..., min_length=10, max_length=20, description="Contact phone number")
    vehicle_type: str = Field(..., description="Vehicle type: bicycle, motorcycle, car, electric_scooter")
    vehicle_number: str = Field(..., min_length=1, max_length=30, description="Vehicle registration number")


class DeliveryPartnerUpdate(AppBaseModel):
    """Update delivery partner profile."""
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = Field(None, max_length=30)



class OnlineStatusUpdate(AppBaseModel):
    """Toggle online/offline."""
    is_online: bool


class LocationUpdate(AppBaseModel):
    """Update current location."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


# Response DTOs

class DeliveryPartnerProfileResponse(AppBaseModel):
    """Delivery partner profile response."""
    id: uuid.UUID
    user_id: int
    phone: str
    vehicle_type: str
    vehicle_number: str
    is_online: bool
    is_verified: bool
    is_suspended: bool = False
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    rating: float
    total_deliveries: int
    total_earnings: float = 0.0
    created_at: datetime
    updated_at: datetime


class DeliveryPartnerBriefResponse(AppBaseModel):
    """Brief delivery partner info for embedding in order responses."""
    id: uuid.UUID
    user_id: int
    phone: str
    vehicle_type: str
    vehicle_number: str
    rating: float
    total_deliveries: int


class DeliveryPartnerAdminResponse(DeliveryPartnerProfileResponse):
    """Admin view with additional info."""
    pass
