"""
app/repositories/order_repo.py
──────────────────────────────
Data access for Orders, OrderItems, and OrderStatusHistory.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional, Sequence

from sqlalchemy import func, select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.order import Order, OrderItem, OrderStatusHistory


class OrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    # Queries

    async def get_by_id(self, order_id: uuid.UUID) -> Order | None:
        stmt = (
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.items),
                selectinload(Order.restaurant),
                selectinload(Order.status_history),
                selectinload(Order.customer),
                selectinload(Order.delivery_address),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_for_update(self, order_id: uuid.UUID) -> Order | None:
        stmt = (
            select(Order)
            .where(Order.id == order_id)
            .with_for_update()
            .options(
                selectinload(Order.items),
                selectinload(Order.restaurant),
                selectinload(Order.status_history),
                selectinload(Order.customer),
                selectinload(Order.delivery_address),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_customer(
        self,
        customer_id: int,
        *,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[Sequence[Order], int]:
        base = select(Order).where(Order.customer_id == customer_id)
        count = await self.session.scalar(
            select(func.count()).select_from(base.subquery())
        ) or 0

        stmt = (
            base
            .options(
                selectinload(Order.items),
                selectinload(Order.restaurant),
                selectinload(Order.customer),
                selectinload(Order.delivery_address),
            )
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all(), count

    async def list_by_restaurant_ids(
        self,
        restaurant_ids: list[uuid.UUID],
        *,
        status_filter: str | None = None,
        exclude_statuses: list[str] | None = None,
        restaurant_filter: uuid.UUID | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[Sequence[Order], int]:
        conditions = [Order.restaurant_id.in_(restaurant_ids)]

        if status_filter:
            conditions.append(Order.status == status_filter)
        if exclude_statuses:
            conditions.append(~Order.status.in_(exclude_statuses))
        if restaurant_filter:
            conditions.append(Order.restaurant_id == restaurant_filter)
        if date_from:
            conditions.append(Order.created_at >= date_from)
        if date_to:
            conditions.append(Order.created_at <= date_to)

        base = select(Order).where(and_(*conditions))
        count = await self.session.scalar(
            select(func.count()).select_from(base.subquery())
        ) or 0

        stmt = (
            base
            .options(
                selectinload(Order.items),
                selectinload(Order.restaurant),
                selectinload(Order.customer),
                selectinload(Order.delivery_address),
            )
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all(), count

    async def list_all(
        self,
        *,
        status_filter: str | None = None,
        exclude_statuses: list[str] | None = None,
        restaurant_filter: uuid.UUID | None = None,
        customer_filter: int | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[Sequence[Order], int]:
        conditions = []

        if status_filter:
            conditions.append(Order.status == status_filter)
        if exclude_statuses:
            conditions.append(~Order.status.in_(exclude_statuses))
        if restaurant_filter:
            conditions.append(Order.restaurant_id == restaurant_filter)
        if customer_filter:
            conditions.append(Order.customer_id == customer_filter)
        if date_from:
            conditions.append(Order.created_at >= date_from)
        if date_to:
            conditions.append(Order.created_at <= date_to)

        base = select(Order)
        if conditions:
            base = base.where(and_(*conditions))

        count = await self.session.scalar(
            select(func.count()).select_from(base.subquery())
        ) or 0

        stmt = (
            base
            .options(
                selectinload(Order.items),
                selectinload(Order.restaurant),
                selectinload(Order.customer),
                selectinload(Order.delivery_address),
            )
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all(), count

    # Mutations

    async def create(self, **kwargs) -> Order:
        order = Order(**kwargs)
        self.session.add(order)
        await self.session.flush()
        return order

    async def update_status(
        self, order: Order, new_status: str, **kwargs
    ) -> Order:
        order.status = new_status
        for k, v in kwargs.items():
            setattr(order, k, v)
        await self.session.flush()
        return order


class OrderItemRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def bulk_create(self, items_data: list[dict]) -> list[OrderItem]:
        items = [OrderItem(**data) for data in items_data]
        self.session.add_all(items)
        await self.session.flush()
        return items


class OrderStatusHistoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        order_id: uuid.UUID,
        old_status: str | None,
        new_status: str,
        changed_by: int | None = None,
        notes: str | None = None,
    ) -> OrderStatusHistory:
        entry = OrderStatusHistory(
            order_id=order_id,
            old_status=old_status,
            new_status=new_status,
            changed_by=changed_by,
            notes=notes,
        )
        self.session.add(entry)
        await self.session.flush()
        return entry
