import uuid
from typing import List

from fastapi import APIRouter, Depends


from app.database import DbSession
from app.schemas.menu import MenuCategoryWithItemsResponse
from app.services.menu_service import MenuService

router = APIRouter(
    prefix="/restaurants/{slug}/menu",
    tags=["Public Menus"],
)


@router.get(
    "",
    response_model=List[MenuCategoryWithItemsResponse],
    summary="Get public menu for a restaurant",
)
async def get_public_menu(
    slug: str,
    db: DbSession,
):
    from app.repositories.restaurant_repo import RestaurantRepository
    from app.models.restaurant import ApprovalStatus
    from fastapi import HTTPException, status
    
    repo = RestaurantRepository(db)
    restaurant = await repo.get_by_slug(slug)
    
    if not restaurant or restaurant.approval_status != ApprovalStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
        
    service = MenuService(db)
    return await service.get_public_menu(restaurant.id)
