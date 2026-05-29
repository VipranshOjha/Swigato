from __future__ import annotations

from datetime import datetime, UTC
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class EventType(str, Enum):
    # Order Lifecycle
    ORDER_CREATED = "ORDER_CREATED"
    ORDER_ACCEPTED = "ORDER_ACCEPTED"
    ORDER_PREPARING = "ORDER_PREPARING"
    ORDER_READY_FOR_PICKUP = "ORDER_READY_FOR_PICKUP"
    RIDER_ASSIGNED = "RIDER_ASSIGNED"
    ORDER_PICKED_UP = "ORDER_PICKED_UP"
    ORDER_IN_TRANSIT = "ORDER_IN_TRANSIT"
    ORDER_DELIVERED = "ORDER_DELIVERED"
    ORDER_REJECTED = "ORDER_REJECTED"
    ORDER_CANCELLED = "ORDER_CANCELLED"
    
    # Payments
    PAYMENT_CAPTURED = "PAYMENT_CAPTURED"
    
    # Reviews
    REVIEW_CREATED = "REVIEW_CREATED"


class EventEnvelope(BaseModel):
    """Canonical event envelope for all system events."""
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: EventType
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    version: int = 1
    sequence_number: int
    actor_id: str | None = None
    tenant_scope: str | None = None
    payload: dict[str, Any]
