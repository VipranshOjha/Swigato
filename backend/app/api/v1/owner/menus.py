import uuid
from typing import List

from fastapi import APIRouter, Depends, status
from app.database import DbSession
from app.dependencies.owner import OwnerUser
from app.schemas.menu import (
    MenuCategoryCreate,
    MenuCategoryResponse,
    MenuCategoryUpdate,
    MenuItemAvailabilityUpdate,
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate,
)
from app.services.menu_service import MenuService

router = APIRouter(
    prefix="/owner/restaurants/{restaurant_id}",
    tags=["Owner Menu Management"],
)

# Categories

@router.post(
    "/categories",
    response_model=MenuCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a menu category",
)
async def create_category(
    restaurant_id: uuid.UUID,
    payload: MenuCategoryCreate,
    db: DbSession,
    current_user: OwnerUser,
):
    service = MenuService(db)
    return await service.create_category(restaurant_id, current_user.id, payload)


@router.get(
    "/categories",
    response_model=List[MenuCategoryResponse],
    summary="List all menu categories for a restaurant",
)
async def list_categories(
    restaurant_id: uuid.UUID,
    db: DbSession,
    current_user: OwnerUser,
):
    service = MenuService(db)
    return await service.get_categories(restaurant_id, current_user.id)


@router.put(
    "/categories/{category_id}",
    response_model=MenuCategoryResponse,
    summary="Update a menu category",
)
async def update_category(
    restaurant_id: uuid.UUID,
    category_id: uuid.UUID,
    payload: MenuCategoryUpdate,
    db: DbSession,
    current_user: OwnerUser,
):
    service = MenuService(db)
    return await service.update_category(restaurant_id, category_id, current_user.id, payload)


@router.delete(
    "/categories/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a menu category",
)
async def delete_category(
    restaurant_id: uuid.UUID,
    category_id: uuid.UUID,
    db: DbSession,
    current_user: OwnerUser,
):
    service = MenuService(db)
    await service.delete_category(restaurant_id, category_id, current_user.id)


# Menu Items

@router.post(
    "/items",
    response_model=MenuItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a menu item",
)
async def create_item(
    restaurant_id: uuid.UUID,
    payload: MenuItemCreate,
    db: DbSession,
    current_user: OwnerUser,
):
    service = MenuService(db)
    return await service.create_item(restaurant_id, current_user.id, payload)


@router.get(
    "/items",
    response_model=List[MenuItemResponse],
    summary="List all menu items for a restaurant",
)
async def list_items(
    restaurant_id: uuid.UUID,
    db: DbSession,
    current_user: OwnerUser,
):
    service = MenuService(db)
    return await service.get_items(restaurant_id, current_user.id)


@router.put(
    "/items/{item_id}",
    response_model=MenuItemResponse,
    summary="Update a menu item",
)
async def update_item(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: MenuItemUpdate,
    db: DbSession,
    current_user: OwnerUser,
):
    service = MenuService(db)
    return await service.update_item(restaurant_id, item_id, current_user.id, payload)


@router.patch(
    "/items/{item_id}/availability",
    response_model=MenuItemResponse,
    summary="Toggle menu item availability",
)
async def toggle_item_availability(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: MenuItemAvailabilityUpdate,
    db: DbSession,
    current_user: OwnerUser,
):
    service = MenuService(db)
    return await service.toggle_item_availability(
        restaurant_id, item_id, current_user.id, payload.is_available
    )


@router.delete(
    "/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a menu item",
)
async def delete_item(
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    db: DbSession,
    current_user: OwnerUser,
):
    service = MenuService(db)
    await service.delete_item(restaurant_id, item_id, current_user.id)
