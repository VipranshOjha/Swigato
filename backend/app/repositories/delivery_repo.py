"""
app/repositories/delivery_repo.py
──────────────────────────────────
Data access for DeliveryPartnerProfile and DeliveryLocationLog.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.delivery import DeliveryPartnerProfile, DeliveryLocationLog


class DeliveryPartnerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # ── Queries ───────────────────────────────────────────────────────────────

    async def get_by_id(self, profile_id: uuid.UUID) -> DeliveryPartnerProfile | None:
        stmt = select(DeliveryPartnerProfile).where(
            DeliveryPartnerProfile.id == profile_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: int) -> DeliveryPartnerProfile | None:
        stmt = select(DeliveryPartnerProfile).where(
            DeliveryPartnerProfile.user_id == user_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def find_available_partner(self) -> DeliveryPartnerProfile | None:
        """Find the first online delivery partner who does not have an active order."""
        from app.models.order import Order
        from app.constants import OrderStatus

        active_statuses = [
            OrderStatus.RIDER_ASSIGNED.value,
            OrderStatus.PICKED_UP.value,
            OrderStatus.IN_TRANSIT.value,
        ]

        stmt = (
            select(DeliveryPartnerProfile)
            .outerjoin(
                Order,
                and_(
                    Order.assigned_delivery_partner_id == DeliveryPartnerProfile.id,
                    Order.status.in_(active_statuses)
                )
            )
            .where(
                DeliveryPartnerProfile.is_online == True,
                DeliveryPartnerProfile.is_suspended == False,
                Order.id == None  # Ensures they have no active orders
            )
            .order_by(DeliveryPartnerProfile.total_deliveries.asc())
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self,
        *,
        is_verified: bool | None = None,
        is_online: bool | None = None,
        is_suspended: bool | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[Sequence[DeliveryPartnerProfile], int]:
        conditions = []
        if is_verified is not None:
            conditions.append(DeliveryPartnerProfile.is_verified == is_verified)
        if is_online is not None:
            conditions.append(DeliveryPartnerProfile.is_online == is_online)
        if is_suspended is not None:
            conditions.append(DeliveryPartnerProfile.is_suspended == is_suspended)

        base = select(DeliveryPartnerProfile)
        if conditions:
            base = base.where(and_(*conditions))

        count = await self.session.scalar(
            select(func.count()).select_from(base.subquery())
        ) or 0

        stmt = (
            base
            .order_by(DeliveryPartnerProfile.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all(), count

    # ── Mutations ─────────────────────────────────────────────────────────────

    async def create(self, **kwargs) -> DeliveryPartnerProfile:
        profile = DeliveryPartnerProfile(**kwargs)
        self.session.add(profile)
        await self.session.flush()
        await self.session.refresh(profile)
        return profile

    async def update(
        self, profile: DeliveryPartnerProfile, **kwargs
    ) -> DeliveryPartnerProfile:
        for k, v in kwargs.items():
            setattr(profile, k, v)
        await self.session.flush()
        await self.session.refresh(profile)
        return profile


class DeliveryLocationLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, **kwargs) -> DeliveryLocationLog:
        log = DeliveryLocationLog(**kwargs)
        self.session.add(log)
        await self.session.flush()
        return log
