"""
app/schemas/order.py
────────────────────
Pydantic v2 request/response schemas for the Orders domain.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.common import AppBaseModel


# ─── Request DTOs ─────────────────────────────────────────────────────────────

class OrderCreate(AppBaseModel):
    """Customer creates an order from their cart."""
    delivery_address_id: int = Field(..., description="ID of the customer's delivery address")
    notes: Optional[str] = Field(None, max_length=500, description="Special instructions")


class OrderRejectPayload(AppBaseModel):
    """Owner rejects an order with a reason."""
    reason: str = Field(..., min_length=1, max_length=500, description="Reason for rejection")


# ─── Response DTOs ────────────────────────────────────────────────────────────

class OrderItemResponse(AppBaseModel):
    id: uuid.UUID
    menu_item_id: Optional[uuid.UUID] = None
    item_name: str
    quantity: int
    unit_price: float
    total_price: float


class OrderStatusHistoryResponse(AppBaseModel):
    id: uuid.UUID
    old_status: Optional[str] = None
    new_status: str
    changed_by: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime


class OrderResponse(AppBaseModel):
    """Standard order response for list views."""
    id: uuid.UUID
    customer_id: int
    restaurant_id: uuid.UUID
    restaurant_name: Optional[str] = None
    status: str
    subtotal: float
    delivery_fee: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    delivery_address_id: Optional[int] = None
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime


class OrderDetailResponse(OrderResponse):
    """Detailed order response with full status history."""
    status_history: list[OrderStatusHistoryResponse] = []
