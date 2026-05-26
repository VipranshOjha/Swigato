import uuid
from typing import Optional, Sequence

from sqlalchemy import select, or_, and_, asc, desc, update
from sqlalchemy.orm import selectinload

from app.models.restaurant import Restaurant, RestaurantCategory, OperatingHour, RestaurantDocument, ApprovalStatus
from app.repositories.base import BaseRepository


class RestaurantRepository(BaseRepository[Restaurant]):
    model = Restaurant

    async def get_by_slug(self, slug: str) -> Optional[Restaurant]:
        """Get a restaurant by its slug, loading relationships."""
        stmt = (
            select(Restaurant)
            .where(Restaurant.slug == slug, Restaurant.deleted_at.is_(None))
            .options(
                selectinload(Restaurant.categories),
                selectinload(Restaurant.operating_hours),
                selectinload(Restaurant.documents)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_with_details(self, id: uuid.UUID) -> Optional[Restaurant]:
        """Get a restaurant by ID, loading all relationships."""
        stmt = (
            select(Restaurant)
            .where(Restaurant.id == id, Restaurant.deleted_at.is_(None))
            .options(
                selectinload(Restaurant.categories),
                selectinload(Restaurant.operating_hours),
                selectinload(Restaurant.documents)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_owner(self, owner_id: uuid.UUID) -> Sequence[Restaurant]:
        """Get all restaurants owned by a user."""
        stmt = (
            select(Restaurant)
            .where(Restaurant.owner_id == owner_id, Restaurant.deleted_at.is_(None))
            .options(
                selectinload(Restaurant.categories),
                selectinload(Restaurant.operating_hours),
                selectinload(Restaurant.documents)
            )
            .order_by(desc(Restaurant.created_at))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def search_public(
        self, 
        query: Optional[str] = None, 
        city: Optional[str] = None,
        is_open: Optional[bool] = None,
        limit: int = 20, 
        offset: int = 0
    ) -> Sequence[Restaurant]:
        """Public search for APPROVED restaurants."""
        stmt = select(Restaurant).where(
            Restaurant.approval_status == ApprovalStatus.APPROVED,
            Restaurant.deleted_at.is_(None)
        ).options(selectinload(Restaurant.categories))

        if query:
            stmt = stmt.where(
                or_(
                    Restaurant.name.ilike(f"%{query}%"),
                    Restaurant.description.ilike(f"%{query}%")
                )
            )
        
        if city:
            stmt = stmt.where(Restaurant.city.ilike(f"%{city}%"))
            
        if is_open is not None:
            stmt = stmt.where(Restaurant.is_open == is_open)

        stmt = stmt.order_by(desc(Restaurant.created_at)).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def count_public(
        self, 
        query: Optional[str] = None, 
        city: Optional[str] = None,
        is_open: Optional[bool] = None
    ) -> int:
        from sqlalchemy import func
        stmt = select(func.count(Restaurant.id)).where(
            Restaurant.approval_status == ApprovalStatus.APPROVED,
            Restaurant.deleted_at.is_(None)
        )
        if query:
            stmt = stmt.where(
                or_(
                    Restaurant.name.ilike(f"%{query}%"),
                    Restaurant.description.ilike(f"%{query}%")
                )
            )
        if city:
            stmt = stmt.where(Restaurant.city.ilike(f"%{city}%"))
        if is_open is not None:
            stmt = stmt.where(Restaurant.is_open == is_open)
            
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_all_admin(
        self, 
        status: Optional[ApprovalStatus] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Sequence[Restaurant]:
        """Admin query to list restaurants with optional status filter."""
        stmt = select(Restaurant).options(
            selectinload(Restaurant.categories),
            selectinload(Restaurant.operating_hours),
            selectinload(Restaurant.documents)
        )
        if status:
            stmt = stmt.where(Restaurant.approval_status == status)
        stmt = stmt.order_by(desc(Restaurant.created_at)).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()
        
    async def count_all_admin(self, status: Optional[ApprovalStatus] = None) -> int:
        from sqlalchemy import func
        stmt = select(func.count(Restaurant.id))
        if status:
            stmt = stmt.where(Restaurant.approval_status == status)
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def is_slug_taken(self, slug: str, exclude_id: Optional[uuid.UUID] = None) -> bool:
        """Check if a slug exists, ignoring soft-deleted restaurants and an optional exclude_id."""
        stmt = select(Restaurant.id).where(
            Restaurant.slug == slug,
            Restaurant.deleted_at.is_(None)
        )
        if exclude_id:
            stmt = stmt.where(Restaurant.id != exclude_id)
        result = await self.session.execute(stmt)
        return result.first() is not None


class CategoryRepository(BaseRepository[RestaurantCategory]):
    model = RestaurantCategory
