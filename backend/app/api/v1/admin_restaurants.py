from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query, Path
import uuid

from app.database import DbSession
from app.core.permissions import AdminUser
from app.core.constants import UserRole
from app.models.restaurant import ApprovalStatus
from app.repositories.restaurant_repo import RestaurantRepository
from app.schemas.common import PaginatedResponse
from app.schemas.restaurant import (
    RestaurantAdminResponse,
    RestaurantApprovalUpdate,
)
from app.services.restaurant_service import RestaurantService


router = APIRouter()

@router.get(
    "/",
    response_model=PaginatedResponse[RestaurantAdminResponse],
    summary="List all restaurants for admin",
)
async def list_all_restaurants(
    status: Optional[ApprovalStatus] = Query(None, description="Filter by approval status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: AdminUser = None,
    db: DbSession = None,
):
    repo = RestaurantRepository(db)
    offset = (page - 1) * page_size
    items = await repo.get_all_admin(status, page_size, offset)
    total = await repo.count_all_admin(status)
    return PaginatedResponse.create(items, total, page, page_size)


@router.patch(
    "/{id}/approve",
    response_model=RestaurantAdminResponse,
    summary="Approve a pending restaurant",
)
async def approve_restaurant(
    id: uuid.UUID = Path(...),
    current_user: AdminUser = None,
    db: DbSession = None,
):
    service = RestaurantService(db)
    return await service.approve_restaurant(id, current_user.id)


@router.patch(
    "/{id}/reject",
    response_model=RestaurantAdminResponse,
    summary="Reject a pending restaurant",
)
async def reject_restaurant(
    payload: RestaurantApprovalUpdate,
    id: uuid.UUID = Path(...),
    current_user: AdminUser = None,
    db: DbSession = None,
):
    service = RestaurantService(db)
    return await service.reject_restaurant(id, current_user.id, payload)


@router.patch(
    "/{id}/suspend",
    response_model=RestaurantAdminResponse,
    summary="Suspend an approved restaurant",
)
async def suspend_restaurant(
    id: uuid.UUID = Path(...),
    current_user: AdminUser = None,
    db: DbSession = None,
):
    service = RestaurantService(db)
    return await service.suspend_restaurant(id)
