import uuid
from typing import List

from fastapi import APIRouter, Depends


from app.database import DbSession
from app.schemas.menu import MenuCategoryWithItemsResponse
from app.services.menu_service import MenuService

router = APIRouter(
    prefix="/restaurants/{restaurant_id}/menu",
    tags=["Public Menus"],
)


@router.get(
    "",
    response_model=List[MenuCategoryWithItemsResponse],
    summary="Get public menu for a restaurant",
)
async def get_public_menu(
    restaurant_id: uuid.UUID,
    db: DbSession,
):
    service = MenuService(db)
    return await service.get_public_menu(restaurant_id)
