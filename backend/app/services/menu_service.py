import uuid
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import MenuCategory, MenuItem
from app.models.restaurant import ApprovalStatus
from app.repositories.menu_repo import MenuCategoryRepository, MenuItemRepository
from app.repositories.restaurant_repo import RestaurantRepository
from app.schemas.menu import MenuCategoryCreate, MenuCategoryUpdate, MenuItemCreate, MenuItemUpdate


class MenuService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.category_repo = MenuCategoryRepository(db)
        self.item_repo = MenuItemRepository(db)
        self.restaurant_repo = RestaurantRepository(db)

    async def _verify_restaurant_owner(self, restaurant_id: uuid.UUID, user_id: int) -> None:
        restaurant = await self.restaurant_repo.get_by_id(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
        if restaurant.owner_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage this restaurant's menu")
        # Ensure approved
        if restaurant.approval_status != ApprovalStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Restaurant must be APPROVED to manage menu"
            )

    # --- Menu Categories ---

    async def create_category(self, restaurant_id: uuid.UUID, user_id: int, payload: MenuCategoryCreate) -> MenuCategory:
        await self._verify_restaurant_owner(restaurant_id, user_id)
        
        display_order = await self.category_repo.get_next_display_order(restaurant_id)
        
        category_data = payload.model_dump()
        category_data["restaurant_id"] = restaurant_id
        if "display_order" not in category_data or category_data["display_order"] == 0:
            category_data["display_order"] = display_order
            
        category = await self.category_repo.create(**category_data)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def get_categories(self, restaurant_id: uuid.UUID, user_id: int) -> Sequence[MenuCategory]:
        await self._verify_restaurant_owner(restaurant_id, user_id)
        return await self.category_repo.get_by_restaurant_id(restaurant_id)

    async def update_category(self, restaurant_id: uuid.UUID, category_id: uuid.UUID, user_id: int, payload: MenuCategoryUpdate) -> MenuCategory:
        await self._verify_restaurant_owner(restaurant_id, user_id)
        
        category = await self.category_repo.get_by_id(category_id)
        if not category or category.restaurant_id != restaurant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu category not found")
            
        update_data = payload.model_dump(exclude_unset=True)
        category = await self.category_repo.update(category, **update_data)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def delete_category(self, restaurant_id: uuid.UUID, category_id: uuid.UUID, user_id: int) -> None:
        await self._verify_restaurant_owner(restaurant_id, user_id)
        
        category = await self.category_repo.get_by_id(category_id)
        if not category or category.restaurant_id != restaurant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu category not found")
            
        # Block if items exist
        item_count = await self.item_repo.count_by_category_id(category_id)
        if item_count > 0:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, 
                detail="Cannot delete category containing menu items"
            )
            
        await self.category_repo.delete(category)
        await self.db.commit()

    # --- Menu Items ---

    async def create_item(self, restaurant_id: uuid.UUID, user_id: int, payload: MenuItemCreate) -> MenuItem:
        await self._verify_restaurant_owner(restaurant_id, user_id)
        
        # Verify category belongs to this restaurant
        category = await self.category_repo.get_by_id(payload.category_id)
        if not category or category.restaurant_id != restaurant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")
            
        item_data = payload.model_dump()
        item_data["restaurant_id"] = restaurant_id
        
        item = await self.item_repo.create(**item_data)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def get_items(self, restaurant_id: uuid.UUID, user_id: int) -> Sequence[MenuItem]:
        await self._verify_restaurant_owner(restaurant_id, user_id)
        return await self.item_repo.get_by_restaurant_id(restaurant_id)

    async def update_item(self, restaurant_id: uuid.UUID, item_id: uuid.UUID, user_id: int, payload: MenuItemUpdate) -> MenuItem:
        await self._verify_restaurant_owner(restaurant_id, user_id)
        
        item = await self.item_repo.get_by_id(item_id)
        if not item or item.restaurant_id != restaurant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
            
        update_data = payload.model_dump(exclude_unset=True)
        
        # Verify new category if provided
        if "category_id" in update_data and update_data["category_id"] != item.category_id:
            category = await self.category_repo.get_by_id(update_data["category_id"])
            if not category or category.restaurant_id != restaurant_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")
                
        item = await self.item_repo.update(item, **update_data)
        await self.db.commit()
        await self.db.refresh(item)
        return item
        
    async def toggle_item_availability(self, restaurant_id: uuid.UUID, item_id: uuid.UUID, user_id: int, is_available: bool) -> MenuItem:
        await self._verify_restaurant_owner(restaurant_id, user_id)
        
        item = await self.item_repo.get_by_id(item_id)
        if not item or item.restaurant_id != restaurant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
            
        item = await self.item_repo.update(item, is_available=is_available)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def delete_item(self, restaurant_id: uuid.UUID, item_id: uuid.UUID, user_id: int) -> None:
        await self._verify_restaurant_owner(restaurant_id, user_id)
        
        item = await self.item_repo.get_by_id(item_id)
        if not item or item.restaurant_id != restaurant_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
            
        await self.item_repo.delete(item)
        await self.db.commit()

    # --- Public API ---
    
    async def get_public_menu(self, restaurant_id: uuid.UUID) -> Sequence[MenuCategory]:
        """Returns categories with their items eagerly loaded for the public view."""
        restaurant = await self.restaurant_repo.get_by_id(restaurant_id)
        if not restaurant or restaurant.approval_status != ApprovalStatus.APPROVED:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
            
        return await self.category_repo.get_with_items(restaurant_id)
