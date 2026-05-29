"""
app/schemas/payment.py
──────────────────────
Pydantic v2 schemas for the Payment domain.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import Field

from app.constants import PaymentGateway, PaymentStatus, RefundStatus
from app.schemas.common import AppBaseModel


# Request DTOs

class PaymentInitializeRequest(AppBaseModel):
    """Customer initializes a payment for an existing order."""
    gateway: PaymentGateway = Field(..., description="The gateway to process the payment")


class RefundRequest(AppBaseModel):
    """Admin requests a refund."""
    amount: float = Field(..., gt=0, description="Amount to refund")
    reason: str = Field(..., min_length=1, max_length=500, description="Reason for refund")


class WebhookPayload(AppBaseModel):
    """Generic payload schema for incoming webhooks."""
    # We accept arbitrary JSON since each provider has different schemas
    # Specific validation happens in the provider's parser
    pass


# Response DTOs

class PaymentEventResponse(AppBaseModel):
    id: uuid.UUID
    event_type: str
    provider_event_id: Optional[str] = None
    created_at: datetime


class RefundResponse(AppBaseModel):
    id: uuid.UUID
    provider_refund_id: Optional[str] = None
    amount: float
    reason: Optional[str] = None
    status: RefundStatus
    created_at: datetime


class PaymentResponse(AppBaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    customer_id: int
    gateway: PaymentGateway
    provider_payment_id: Optional[str] = None
    amount: float
    currency: str
    status: PaymentStatus
    payment_method: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PaymentDetailResponse(PaymentResponse):
    events: list[PaymentEventResponse] = []
    refunds: list[RefundResponse] = []


class PaymentIntentResponse(AppBaseModel):
    """Returned when payment is successfully initialized."""
    payment_id: uuid.UUID
    provider_payment_id: str
    amount: float
    currency: str
    gateway: PaymentGateway
    client_secret: Optional[str] = None  # Some providers return this
