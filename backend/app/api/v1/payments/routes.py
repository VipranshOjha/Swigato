"""
app/api/v1/payments.py
──────────────────────
Endpoints for payment initialization, webhooks, and administrative actions.
"""
import uuid
from typing import Any

from fastapi import APIRouter, Depends, Header, Request, status

from app.constants import PaymentGateway, UserRole
from app.dependencies.auth import AuthUser, require_roles
from app.dependencies.admin import AdminUser
from app.database import DbSession
from app.schemas.payment import (
    PaymentDetailResponse,
    PaymentInitializeRequest,
    PaymentIntentResponse,
    RefundRequest,
)
from app.services.payment_service import PaymentService

router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


@router.post(
    "/orders/{order_id}/initialize",
    response_model=PaymentIntentResponse,
    summary="Initialize payment for an order",
    dependencies=[Depends(require_roles(UserRole.CUSTOMER))],
)
async def initialize_payment(
    order_id: uuid.UUID,
    payload: PaymentInitializeRequest,
    current_user: AuthUser,
    db: DbSession,
):
    service = PaymentService(db)
    return await service.initialize_payment(current_user.id, order_id, payload)


@router.post(
    "/webhooks/{gateway}",
    status_code=status.HTTP_200_OK,
    summary="Handle gateway webhooks",
)
async def handle_webhook(
    gateway: PaymentGateway,
    request: Request,
    db: DbSession,
    x_signature: str | None = Header(None, alias="X-Signature"),
    stripe_signature: str | None = Header(None, alias="Stripe-Signature"),
    razorpay_signature: str | None = Header(None, alias="X-Razorpay-Signature"),
):
    """
    Public webhook endpoint for providers.
    Providers send different signature headers, we try to grab any common ones.
    """
    # Pick the first non-null signature
    signature = x_signature or stripe_signature or razorpay_signature
    
    # We use await request.json() to get the payload (or await request.body() if provider needs raw bytes for signature)
    # For now json() is sufficient for mock
    payload = await request.json()

    service = PaymentService(db)
    result = await service.handle_webhook(gateway, payload, signature)
    return result


@router.post(
    "/{payment_id}/refund",
    summary="Admin initiates a refund",
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
)
async def refund_payment(
    payment_id: uuid.UUID,
    payload: RefundRequest,
    current_user: AdminUser,
    db: DbSession,
):
    service = PaymentService(db)
    return await service.request_refund(
        admin_id=current_user.id,
        payment_id=payment_id,
        amount=payload.amount,
        reason=payload.reason
    )
