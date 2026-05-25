from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import DbSession
from app.repositories.restaurant_repo import RestaurantRepository
from app.schemas.common import PaginatedResponse
from app.schemas.restaurant import RestaurantPublicResponse, RestaurantPublicDetailResponse


router = APIRouter()

@router.get(
    "/",
    response_model=PaginatedResponse[RestaurantPublicResponse],
    summary="List all approved restaurants",
)
async def list_restaurants(
    query: Optional[str] = Query(None, description="Search term for name or description"),
    city: Optional[str] = Query(None, description="Filter by city"),
    is_open: Optional[bool] = Query(None, description="Filter by open status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: DbSession = None,
):
    repo = RestaurantRepository(db)
    offset = (page - 1) * page_size
    items = await repo.search_public(query, city, is_open, page_size, offset)
    total = await repo.count_public(query, city, is_open)
    return PaginatedResponse.create(items, total, page, page_size)


@router.get(
    "/{slug}",
    response_model=RestaurantPublicDetailResponse,
    summary="Get restaurant details by slug",
)
async def get_restaurant(
    slug: str = Path(..., description="Restaurant slug"),
    db: DbSession = None,
):
    repo = RestaurantRepository(db)
    restaurant = await repo.get_by_slug(slug)
    if not restaurant or restaurant.approval_status != "APPROVED":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return restaurant
