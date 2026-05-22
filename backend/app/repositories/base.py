"""
app/repositories/base.py
─────────────────────────
Generic async CRUD repository base class.

Why a repository layer?
- Services never touch SQLAlchemy directly — only repositories do
- Makes services testable with mock repositories
- Centralizes query patterns (soft-delete filtering, pagination)
- Single place to add query logging, caching hooks, or sharding logic later
"""
from __future__ import annotations

from typing import Any, Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """
    Generic async CRUD repository.

    Subclasses override `model` class variable:

        class UserRepository(BaseRepository[User]):
            model = User
    """

    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, id: int) -> ModelT | None:
        return await self.session.get(self.model, id)

    async def get_all(
        self,
        *,
        offset: int = 0,
        limit: int = 20,
        filters: list[Any] | None = None,
        order_by: list[Any] | None = None,
    ) -> tuple[list[ModelT], int]:
        """
        Returns (items, total_count) — count query runs alongside select.
        Always apply soft-delete filter if model has deleted_at.
        """
        stmt = select(self.model)
        count_stmt = select(func.count()).select_from(self.model)

        # Auto-apply soft-delete filter
        if hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]
            count_stmt = count_stmt.where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]

        if filters:
            for f in filters:
                stmt = stmt.where(f)
                count_stmt = count_stmt.where(f)

        if order_by:
            stmt = stmt.order_by(*order_by)

        total = await self.session.scalar(count_stmt) or 0
        result = await self.session.execute(stmt.offset(offset).limit(limit))
        items = list(result.scalars().all())

        return items, total

    async def create(self, **kwargs: Any) -> ModelT:
        """Create and persist a new model instance."""
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.flush()  # Get generated ID without committing
        await self.session.refresh(instance)
        return instance

    async def update(self, instance: ModelT, **kwargs: Any) -> ModelT:
        """Update fields on an existing instance."""
        for key, value in kwargs.items():
            setattr(instance, key, value)
        await self.session.flush()
        await self.session.refresh(instance)
        return instance

    async def delete(self, instance: ModelT) -> None:
        """Hard delete — prefer soft_delete() for most entities."""
        await self.session.delete(instance)
        await self.session.flush()

    async def soft_delete(self, instance: ModelT) -> None:
        """
        Soft delete — sets deleted_at timestamp.
        Requires model to have SoftDeleteMixin.
        """
        if not hasattr(instance, "soft_delete"):
            raise TypeError(f"{self.model.__name__} does not support soft delete.")
        instance.soft_delete()  # type: ignore[union-attr]
        await self.session.flush()

    async def count(self, *filters: Any) -> int:
        stmt = select(func.count()).select_from(self.model)
        if hasattr(self.model, "deleted_at"):
            stmt = stmt.where(self.model.deleted_at.is_(None))  # type: ignore[attr-defined]
        for f in filters:
            stmt = stmt.where(f)
        return await self.session.scalar(stmt) or 0
