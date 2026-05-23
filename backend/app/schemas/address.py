"""
app/schemas/address.py
───────────────────────
Pydantic schemas for Address management.
"""
from __future__ import annotations

from datetime import datetime
from pydantic import Field

from app.schemas.common import AppBaseModel


class AddressCreate(AppBaseModel):
    label: str | None = Field(default=None, max_length=50)
    address_line1: str = Field(..., min_length=1, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    landmark: str | None = Field(default=None, max_length=100)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=1, max_length=100)
    country: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., min_length=1, max_length=20)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    is_default: bool = Field(default=False)


class AddressUpdate(AppBaseModel):
    label: str | None = Field(default=None, max_length=50)
    address_line1: str | None = Field(default=None, min_length=1, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    landmark: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    state: str | None = Field(default=None, min_length=1, max_length=100)
    country: str | None = Field(default=None, min_length=1, max_length=100)
    postal_code: str | None = Field(default=None, min_length=1, max_length=20)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class AddressResponse(AppBaseModel):
    id: int
    user_id: int
    label: str | None
    address_line1: str
    address_line2: str | None
    landmark: str | None
    city: str
    state: str
    country: str
    postal_code: str
    latitude: float | None
    longitude: float | None
    is_default: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_address(cls, address) -> "AddressResponse":
        return cls(
            id=address.id,
            user_id=address.user_id,
            label=address.label,
            address_line1=address.address_line1,
            address_line2=address.address_line2,
            landmark=address.landmark,
            city=address.city,
            state=address.state,
            country=address.country,
            postal_code=address.postal_code,
            latitude=float(address.latitude) if address.latitude is not None else None,
            longitude=float(address.longitude) if address.longitude is not None else None,
            is_default=address.is_default,
            created_at=address.created_at,
            updated_at=address.updated_at,
        )
