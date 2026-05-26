import uuid
from typing import List

from fastapi import APIRouter, Depends, Path
from app.database import DbSession
from app.dependencies.owner import OwnerUser
from app.constants import UserRole
from app.repositories.restaurant_repo import RestaurantRepository
from app.schemas.restaurant import (
    RestaurantCreate,
    RestaurantOwnerResponse,
    RestaurantUpdate,
)
from app.services.restaurant_service import RestaurantService


router = APIRouter()

@router.get(
    "/",
    response_model=List[RestaurantOwnerResponse],
    summary="List all restaurants owned by the current user",
)
async def list_my_restaurants(
    current_user: OwnerUser = None,
    db: DbSession = None,
):
    repo = RestaurantRepository(db)
    return await repo.get_by_owner(current_user.id)


@router.post(
    "/",
    response_model=RestaurantOwnerResponse,
    summary="Create a new restaurant",
)
async def create_restaurant(
    payload: RestaurantCreate,
    current_user: OwnerUser = None,
    db: DbSession = None,
):
    import logging
    logger = logging.getLogger(__name__)
    logger.debug("create_restaurant endpoint: calling service")
    service = RestaurantService(db)
    result = await service.create_restaurant(current_user.id, payload)
    logger.debug("create_restaurant endpoint: returning result to fastapi/pydantic")
    return result


@router.get(
    "/{id}",
    response_model=RestaurantOwnerResponse,
    summary="Get details of an owned restaurant",
)
async def get_my_restaurant(
    id: uuid.UUID = Path(...),
    current_user: OwnerUser = None,
    db: DbSession = None,
):
    service = RestaurantService(db)
    restaurant = await service.get_by_id(id)
    if restaurant.owner_id != current_user.id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return restaurant


@router.put(
    "/{id}",
    response_model=RestaurantOwnerResponse,
    summary="Update an owned restaurant",
)
async def update_my_restaurant(
    payload: RestaurantUpdate,
    id: uuid.UUID = Path(...),
    current_user: OwnerUser = None,
    db: DbSession = None,
):
    service = RestaurantService(db)
    return await service.update_restaurant(id, current_user.id, payload)


@router.post(
    "/{id}/submit",
    response_model=RestaurantOwnerResponse,
    summary="Submit restaurant for admin approval",
)
async def submit_restaurant(
    id: uuid.UUID = Path(...),
    current_user: OwnerUser = None,
    db: DbSession = None,
):
    service = RestaurantService(db)
    return await service.submit_for_approval(id, current_user.id)
