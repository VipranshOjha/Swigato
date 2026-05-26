import uuid
from typing import Sequence

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.menu import MenuCategory, MenuItem


class MenuCategoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, category_id: uuid.UUID) -> MenuCategory | None:
        stmt = select(MenuCategory).where(
            MenuCategory.id == category_id,
            MenuCategory.deleted_at.is_(None)
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_restaurant_id(self, restaurant_id: uuid.UUID) -> Sequence[MenuCategory]:
        stmt = select(MenuCategory).where(
            MenuCategory.restaurant_id == restaurant_id,
            MenuCategory.deleted_at.is_(None)
        ).order_by(MenuCategory.display_order)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_with_items(self, restaurant_id: uuid.UUID) -> Sequence[MenuCategory]:
        # Only active items for public menu
        stmt = select(MenuCategory).where(
            MenuCategory.restaurant_id == restaurant_id,
            MenuCategory.deleted_at.is_(None),
            MenuCategory.is_active == True
        ).options(
            selectinload(MenuCategory.items.and_(
                MenuItem.deleted_at.is_(None),
                MenuItem.is_available == True
            ))
        ).order_by(MenuCategory.display_order)
        result = await self.session.execute(stmt)
        return result.scalars().all()
        
    async def get_next_display_order(self, restaurant_id: uuid.UUID) -> int:
        stmt = select(func.max(MenuCategory.display_order)).where(
            MenuCategory.restaurant_id == restaurant_id,
            MenuCategory.deleted_at.is_(None)
        )
        result = await self.session.execute(stmt)
        max_order = result.scalar()
        return (max_order or 0) + 1

    async def create(self, **kwargs) -> MenuCategory:
        category = MenuCategory(**kwargs)
        self.session.add(category)
        return category

    async def update(self, category: MenuCategory, **kwargs) -> MenuCategory:
        for key, value in kwargs.items():
            setattr(category, key, value)
        return category

    async def delete(self, category: MenuCategory) -> None:
        from datetime import datetime, timezone
        category.deleted_at = datetime.now(timezone.utc)


class MenuItemRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, item_id: uuid.UUID) -> MenuItem | None:
        stmt = select(MenuItem).where(
            MenuItem.id == item_id,
            MenuItem.deleted_at.is_(None)
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_category_id(self, category_id: uuid.UUID) -> Sequence[MenuItem]:
        stmt = select(MenuItem).where(
            MenuItem.category_id == category_id,
            MenuItem.deleted_at.is_(None)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_restaurant_id(self, restaurant_id: uuid.UUID) -> Sequence[MenuItem]:
        stmt = select(MenuItem).where(
            MenuItem.restaurant_id == restaurant_id,
            MenuItem.deleted_at.is_(None)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def count_by_category_id(self, category_id: uuid.UUID) -> int:
        stmt = select(func.count(MenuItem.id)).where(
            MenuItem.category_id == category_id,
            MenuItem.deleted_at.is_(None)
        )
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def create(self, **kwargs) -> MenuItem:
        item = MenuItem(**kwargs)
        self.session.add(item)
        return item

    async def update(self, item: MenuItem, **kwargs) -> MenuItem:
        for key, value in kwargs.items():
            setattr(item, key, value)
        return item

    async def delete(self, item: MenuItem) -> None:
        from datetime import datetime, timezone
        item.deleted_at = datetime.now(timezone.utc)
