import re
import uuid
from datetime import datetime, timezone
from typing import Sequence, Tuple

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.restaurant import ApprovalStatus, Restaurant
from app.repositories.restaurant_repo import RestaurantRepository
from app.schemas.restaurant import (
    RestaurantApprovalUpdate,
    RestaurantCreate,
    RestaurantUpdate,
)


class RestaurantService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = RestaurantRepository(db)

    async def _generate_unique_slug(self, name: str, exclude_id: uuid.UUID | None = None) -> str:
        """Generate a unique slug based on the restaurant name."""
        # Basic slugification
        base_slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        if not base_slug:
            base_slug = "restaurant"
            
        slug = base_slug
        counter = 1
        
        while await self.repo.is_slug_taken(slug, exclude_id):
            slug = f"{base_slug}-{counter}"
            counter += 1
            
        return slug

    async def create_restaurant(self, owner_id: int, payload: RestaurantCreate) -> Restaurant:
        """Create a new restaurant in DRAFT status."""
        slug = await self.generate_unique_slug(payload.name)
        
        restaurant_data = payload.model_dump()
        restaurant_data["owner_id"] = owner_id
        restaurant_data["slug"] = slug
        restaurant_data["approval_status"] = ApprovalStatus.DRAFT
        restaurant = await self.repo.create(**restaurant_data)
        
        # Prevent MissingGreenlet during Pydantic serialization
        # A newly created restaurant naturally has no related records yet.
        # We must use set_committed_value to avoid triggering a lazy load of the old collection!
        from sqlalchemy.orm.attributes import set_committed_value
        set_committed_value(restaurant, 'categories', [])
        set_committed_value(restaurant, 'operating_hours', [])
        set_committed_value(restaurant, 'documents', [])
        
        return restaurant

    async def generate_unique_slug(self, name: str, exclude_id: uuid.UUID | None = None) -> str:
        return await self._generate_unique_slug(name, exclude_id)

    async def get_by_id(self, restaurant_id: uuid.UUID) -> Restaurant:
        restaurant = await self.repo.get_with_details(restaurant_id)
        if not restaurant:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
        return restaurant

    async def update_restaurant(
        self, restaurant_id: uuid.UUID, owner_id: int, payload: RestaurantUpdate
    ) -> Restaurant:
        restaurant = await self.get_by_id(restaurant_id)
        
        if restaurant.owner_id != owner_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this restaurant")
            
        update_data = payload.model_dump(exclude_unset=True)
        
        if "name" in update_data and update_data["name"] != restaurant.name:
            update_data["slug"] = await self.generate_unique_slug(update_data["name"], exclude_id=restaurant_id)

        # If it was rejected and they update it, we don't automatically submit it, but they can.
        # If they update an approved restaurant, we don't drop status unless it's a major change (out of scope for now).
            
        updated_restaurant = await self.repo.update(restaurant, **update_data)
        return updated_restaurant

    async def submit_for_approval(self, restaurant_id: uuid.UUID, owner_id: int) -> Restaurant:
        """Owner submits the restaurant for admin approval."""
        restaurant = await self.get_by_id(restaurant_id)
        
        if restaurant.owner_id != owner_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
            
        if restaurant.approval_status not in [ApprovalStatus.DRAFT, ApprovalStatus.REJECTED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Cannot submit restaurant in {restaurant.approval_status.value} status"
            )
            
        # Optional: Add validation here to ensure required documents/fields are present before submission.
        
        return await self.repo.update(restaurant, **{"approval_status": ApprovalStatus.PENDING_APPROVAL})

    # Admin Methods

    async def approve_restaurant(self, restaurant_id: uuid.UUID, admin_id: int) -> Restaurant:
        restaurant = await self.get_by_id(restaurant_id)
        
        if restaurant.approval_status != ApprovalStatus.PENDING_APPROVAL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Restaurant must be in PENDING_APPROVAL status to be approved"
            )
            
        return await self.repo.update(
            restaurant, 
            **{
                "approval_status": ApprovalStatus.APPROVED,
                "is_open": True,
                "verified_at": datetime.now(timezone.utc),
                "verified_by": admin_id,
                "rejection_reason": None
            }
        )

    async def reject_restaurant(self, restaurant_id: uuid.UUID, admin_id: int, payload: RestaurantApprovalUpdate) -> Restaurant:
        restaurant = await self.get_by_id(restaurant_id)
        
        if restaurant.approval_status != ApprovalStatus.PENDING_APPROVAL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Restaurant must be in PENDING_APPROVAL status to be rejected"
            )
            
        return await self.repo.update(
            restaurant,
            **{
                "approval_status": ApprovalStatus.REJECTED,
                "verified_at": datetime.now(timezone.utc),
                "verified_by": admin_id,
                "rejection_reason": payload.rejection_reason
            }
        )

    async def suspend_restaurant(self, restaurant_id: uuid.UUID) -> Restaurant:
        restaurant = await self.get_by_id(restaurant_id)
        
        if restaurant.approval_status != ApprovalStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only approved restaurants can be suspended"
            )
            
        return await self.repo.update(
            restaurant,
            **{
                "approval_status": ApprovalStatus.SUSPENDED,
                "is_open": False  # Force close when suspended
            }
        )

    async def activate_restaurant(self, restaurant_id: uuid.UUID) -> Restaurant:
        restaurant = await self.get_by_id(restaurant_id)
        
        if restaurant.approval_status != ApprovalStatus.SUSPENDED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only suspended restaurants can be activated"
            )
            
        return await self.repo.update(
            restaurant,
            **{
                "approval_status": ApprovalStatus.APPROVED,
            }
        )
