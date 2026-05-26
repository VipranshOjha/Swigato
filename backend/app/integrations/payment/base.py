"""
app/services/payment_gateways/base.py
─────────────────────────────────────
Abstract base class for payment gateway providers.
"""
from abc import ABC, abstractmethod
from typing import Any


class PaymentGatewayProvider(ABC):
    @abstractmethod
    async def create_payment_intent(self, amount: float, currency: str, receipt_id: str) -> dict[str, Any]:
        """
        Creates a payment intent/order on the gateway.
        Returns a dict containing provider_payment_id and any needed client_secret.
        """
        pass

    @abstractmethod
    async def verify_webhook_signature(self, payload: str | dict, signature: str | None) -> bool:
        """
        Verifies that the webhook came from the legitimate gateway provider.
        """
        pass

    @abstractmethod
    async def process_refund(self, provider_payment_id: str, amount: float, reason: str | None) -> dict[str, Any]:
        """
        Processes a refund.
        Returns a dict containing the provider_refund_id.
        """
        pass
