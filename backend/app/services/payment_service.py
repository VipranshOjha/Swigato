"""
app/services/payment_service.py
───────────────────────────────
Business logic for managing payments and handling webhooks.
"""
import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import OrderStatus, PaymentGateway, PaymentStatus, RefundStatus
from app.core.exceptions import SwigatoException, InvalidWebhookSignatureError
from app.repositories.order_repo import OrderRepository
from app.repositories.payment_repo import (
    PaymentEventRepository,
    PaymentRepository,
    RefundRepository,
)
from app.services.order_service import OrderService
from app.integrations.payment.base import PaymentGatewayProvider
from app.integrations.payment.mock_gateway import MockPaymentGateway
from app.schemas.payment import (
    PaymentDetailResponse,
    PaymentInitializeRequest,
    PaymentIntentResponse,
)


class PaymentService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.payment_repo = PaymentRepository(session)
        self.event_repo = PaymentEventRepository(session)
        self.refund_repo = RefundRepository(session)
        self.order_repo = OrderRepository(session)
        self.order_service = OrderService(session)

    def _get_provider(self, gateway: PaymentGateway) -> PaymentGatewayProvider:
        # In the future, match on STRIPE or RAZORPAY to return correct provider
        return MockPaymentGateway()

    async def initialize_payment(
        self, user_id: int, order_id: uuid.UUID, payload: PaymentInitializeRequest
    ) -> PaymentIntentResponse:
        """
        Creates an intent with the provider and records the pending payment in DB.
        """
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        if order.customer_id != user_id:
            raise HTTPException(status_code=403, detail="Permission denied")

        if order.status != OrderStatus.PENDING and order.status != OrderStatus.PAYMENT_FAILED:
            raise HTTPException(
                status_code=400, detail=f"Cannot initialize payment for order in status: {order.status}"
            )

        provider = self._get_provider(payload.gateway)

        # Call gateway
        intent_data = await provider.create_payment_intent(
            amount=float(order.total_amount),
            currency="INR",
            receipt_id=str(order.id)
        )

        # Create Payment DB record
        payment = await self.payment_repo.create(
            order_id=order.id,
            customer_id=user_id,
            gateway=payload.gateway.value,
            provider_payment_id=intent_data.get("provider_payment_id"),
            amount=order.total_amount,
            currency="INR",
            status=PaymentStatus.PENDING.value,
        )

        # Transition order to AWAITING_PAYMENT
        await self.order_service._transition_state(
            order, OrderStatus.AWAITING_PAYMENT, changed_by=user_id, notes="Payment initialized"
        )
        
        await self.session.commit()

        return PaymentIntentResponse(
            payment_id=payment.id,
            provider_payment_id=intent_data["provider_payment_id"],
            amount=float(order.total_amount),
            currency="INR",
            gateway=payload.gateway,
            client_secret=intent_data.get("client_secret")
        )

    async def handle_webhook(
        self, gateway: PaymentGateway, payload: dict[str, Any], signature: str | None
    ) -> dict[str, str]:
        """
        Generic webhook handler supporting idempotency.
        """
        provider = self._get_provider(gateway)

        if not await provider.verify_webhook_signature(payload, signature):
            raise InvalidWebhookSignatureError()

        # Idempotency check
        provider_event_id = payload.get("id") or payload.get("event_id")
        if provider_event_id:
            existing_event = await self.event_repo.get_by_provider_event_id(provider_event_id)
            if existing_event:
                # We've already processed this exact event, ignore it safely
                return {"status": "ignored", "reason": "duplicate_event"}

        # Extract payment data (gateway specific logic usually here, we'll mock it based on payload structure)
        # Mock assumption: payload contains "provider_payment_id", "status" (captured, failed), "method"
        provider_payment_id = payload.get("provider_payment_id")
        event_type = payload.get("type", "unknown")
        gateway_status = payload.get("status")
        payment_method = payload.get("method")

        if not provider_payment_id:
            # Maybe it's a non-payment event, ignore
            return {"status": "ignored", "reason": "no_payment_id"}

        payment = await self.payment_repo.get_by_provider_id(provider_payment_id)
        if not payment:
            # We don't have this payment, ignore
            return {"status": "ignored", "reason": "payment_not_found"}

        # Save event
        await self.event_repo.create(
            payment_id=payment.id,
            event_type=event_type,
            provider_event_id=provider_event_id,
            raw_payload=payload
        )

        # Transition Payment & Order state based on gateway event
        if gateway_status == "captured" and payment.status != PaymentStatus.CAPTURED.value:
            payment.status = PaymentStatus.CAPTURED.value
            if payment_method:
                payment.payment_method = payment_method
                
            await self.payment_repo.update(payment)

            order = await self.order_repo.get_by_id(payment.order_id)
            if order and order.status == OrderStatus.AWAITING_PAYMENT:
                await self.order_service._transition_state(
                    order, OrderStatus.PLACED, notes="Payment captured via webhook"
                )

        elif gateway_status == "failed" and payment.status != PaymentStatus.FAILED.value:
            payment.status = PaymentStatus.FAILED.value
            await self.payment_repo.update(payment)

            order = await self.order_repo.get_by_id(payment.order_id)
            if order and order.status == OrderStatus.AWAITING_PAYMENT:
                await self.order_service._transition_state(
                    order, OrderStatus.PAYMENT_FAILED, notes="Payment failed via webhook"
                )

        await self.session.commit()
        return {"status": "processed"}

    async def request_refund(self, admin_id: int, payment_id: uuid.UUID, amount: float, reason: str) -> dict:
        """
        Admins can request a refund for a captured payment.
        """
        payment = await self.payment_repo.get_by_id(payment_id)
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
            
        if payment.status != PaymentStatus.CAPTURED.value and payment.status != PaymentStatus.PARTIALLY_REFUNDED.value:
            raise HTTPException(status_code=400, detail="Can only refund captured payments")

        provider = self._get_provider(PaymentGateway(payment.gateway))
        
        refund_data = await provider.process_refund(
            provider_payment_id=payment.provider_payment_id,
            amount=amount,
            reason=reason
        )

        # Record Refund
        refund = await self.refund_repo.create(
            payment_id=payment.id,
            provider_refund_id=refund_data.get("provider_refund_id"),
            amount=amount,
            reason=reason,
            status=RefundStatus.COMPLETED.value
        )

        # Update payment status
        # If amount matches full payment amount, fully refunded, else partially
        # For simplicity in mock:
        if amount >= float(payment.amount):
            payment.status = PaymentStatus.REFUNDED.value
        else:
            payment.status = PaymentStatus.PARTIALLY_REFUNDED.value
            
        await self.payment_repo.update(payment)
        
        # If order wasn't cancelled yet, we might want to cancel it (or log it)
        order = await self.order_repo.get_by_id(payment.order_id)
        if order and order.status not in [OrderStatus.CANCELLED.value, OrderStatus.REFUNDED.value]:
            await self.order_service._transition_state(
                order, OrderStatus.REFUNDED, changed_by=admin_id, notes=f"Refunded: {reason}"
            )

        await self.session.commit()
        return {"status": "refund_processed", "refund_id": refund.id}

    async def get_admin_payments(
        self,
        page: int = 1,
        page_size: int = 20,
        status_filter: str | None = None,
        gateway_filter: str | None = None,
    ):
        offset = (page - 1) * page_size
        items, total = await self.payment_repo.list_all(
            status_filter=status_filter,
            gateway_filter=gateway_filter,
            limit=page_size,
            offset=offset,
        )
        return items, total
