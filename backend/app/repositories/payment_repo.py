"""
app/repositories/payment_repo.py
────────────────────────────────
Data access for Payment, PaymentEvent, and Refund.
"""
from __future__ import annotations

import uuid
from typing import Any, Optional, Sequence

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.payment import Payment, PaymentEvent, Refund


class PaymentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, payment_id: uuid.UUID) -> Payment | None:
        stmt = (
            select(Payment)
            .where(Payment.id == payment_id)
            .options(
                selectinload(Payment.events),
                selectinload(Payment.refunds),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_provider_id(self, provider_payment_id: str) -> Payment | None:
        stmt = (
            select(Payment)
            .where(Payment.provider_payment_id == provider_payment_id)
            .options(
                selectinload(Payment.events),
                selectinload(Payment.refunds),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_order_id(self, order_id: uuid.UUID) -> Sequence[Payment]:
        stmt = select(Payment).where(Payment.order_id == order_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(self, **kwargs) -> Payment:
        payment = Payment(**kwargs)
        self.session.add(payment)
        await self.session.flush()
        return payment

    async def update(self, payment: Payment, **kwargs) -> Payment:
        for k, v in kwargs.items():
            setattr(payment, k, v)
        await self.session.flush()
        return payment

    async def list_all(
        self,
        status_filter: str | None = None,
        gateway_filter: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[Sequence[Payment], int]:
        stmt = select(Payment)
        count_stmt = select(func.count(Payment.id))

        if status_filter:
            stmt = stmt.where(Payment.status == status_filter)
            count_stmt = count_stmt.where(Payment.status == status_filter)
            
        if gateway_filter:
            stmt = stmt.where(Payment.gateway == gateway_filter)
            count_stmt = count_stmt.where(Payment.gateway == gateway_filter)

        # Count total
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        # Get items
        stmt = (
            stmt.order_by(Payment.created_at.desc())
            .offset(offset)
            .limit(limit)
            .options(
                selectinload(Payment.events),
                selectinload(Payment.refunds),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalars().all(), total


class PaymentEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_provider_event_id(self, provider_event_id: str) -> PaymentEvent | None:
        stmt = select(PaymentEvent).where(PaymentEvent.provider_event_id == provider_event_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        payment_id: uuid.UUID,
        event_type: str,
        provider_event_id: str | None = None,
        raw_payload: dict[str, Any] | None = None,
    ) -> PaymentEvent:
        event = PaymentEvent(
            payment_id=payment_id,
            event_type=event_type,
            provider_event_id=provider_event_id,
            raw_payload=raw_payload,
        )
        self.session.add(event)
        await self.session.flush()
        return event


class RefundRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, **kwargs) -> Refund:
        refund = Refund(**kwargs)
        self.session.add(refund)
        await self.session.flush()
        return refund

    async def update(self, refund: Refund, **kwargs) -> Refund:
        for k, v in kwargs.items():
            setattr(refund, k, v)
        await self.session.flush()
        return refund
