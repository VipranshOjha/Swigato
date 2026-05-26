"""
app/services/payment_gateways/mock_gateway.py
─────────────────────────────────────────────
Mock implementation of a payment gateway for Phase 7 development.
"""
import uuid
import asyncio
from typing import Any

from app.integrations.payment.base import PaymentGatewayProvider


class MockPaymentGateway(PaymentGatewayProvider):
    async def create_payment_intent(self, amount: float, currency: str, receipt_id: str) -> dict[str, Any]:
        """
        Mock intent creation.
        Returns a fake provider_payment_id.
        """
        # Simulate network latency
        await asyncio.sleep(0.5)
        
        return {
            "provider_payment_id": f"mock_order_{uuid.uuid4().hex[:12]}",
            "client_secret": f"mock_secret_{uuid.uuid4().hex[:12]}",
        }

    async def verify_webhook_signature(self, payload: str | dict, signature: str | None) -> bool:
        """
        Always returns True for mock unless signature is 'INVALID'.
        """
        if signature == "INVALID":
            return False
        return True

    async def process_refund(self, provider_payment_id: str, amount: float, reason: str | None) -> dict[str, Any]:
        """
        Mock refund processing.
        """
        await asyncio.sleep(0.5)
        return {
            "provider_refund_id": f"mock_rfnd_{uuid.uuid4().hex[:12]}",
            "status": "completed",
        }
