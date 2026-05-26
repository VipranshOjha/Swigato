"""
app/api/v1/owner_orders.py
──────────────────────────
Endpoints for restaurant owners to manage orders.
"""
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.constants import OrderStatus, UserRole, PRE_PAYMENT_STATUSES
from app.dependencies.owner import OwnerUser, require_roles
from app.database import DbSession
from app.repositories.restaurant_repo import RestaurantRepository
from app.schemas.common import PaginatedResponse
from app.schemas.order import (
    OrderDetailResponse,
    OrderRejectPayload,
    OrderResponse,
)
from app.services.order_service import OrderService

router = APIRouter(
    prefix="/orders",
    tags=["Owner Orders"],
    dependencies=[Depends(require_roles(UserRole.RESTAURANT_OWNER))],
)


@router.get(
    "",
    response_model=PaginatedResponse[OrderResponse],
    summary="List all orders for owner's restaurants",
)
async def list_owner_orders(
    current_user: OwnerUser,
    db: DbSession,
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    restaurant_id: Optional[uuid.UUID] = Query(None, description="Filter by restaurant"),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    # Get owner's restaurants
    rest_repo = RestaurantRepository(db)
    restaurants = await rest_repo.get_by_owner(current_user.id)
    rest_ids = [r.id for r in restaurants]

    if not rest_ids:
        return PaginatedResponse.create([], 0, page, page_size)

    # Filter to requested restaurant if specified, and verify ownership
    if restaurant_id:
        if restaurant_id not in rest_ids:
            return PaginatedResponse.create([], 0, page, page_size)
        rest_ids = [restaurant_id]

    service = OrderService(db)
    offset = (page - 1) * page_size
    items, total = await service.order_repo.list_by_restaurant_ids(
        restaurant_ids=rest_ids,
        status_filter=status_filter,
        exclude_statuses=PRE_PAYMENT_STATUSES,
        date_from=date_from,
        date_to=date_to,
        limit=page_size,
        offset=offset,
    )
    return PaginatedResponse.create(items, total, page, page_size)


@router.get(
    "/{order_id}",
    response_model=OrderDetailResponse,
    summary="Get order details",
)
async def get_order_detail(
    order_id: uuid.UUID,
    current_user: OwnerUser,
    db: DbSession,
):
    service = OrderService(db)
    order = await service._get_order(order_id)
    
    # We can rely on service layer to check ownership during mutations, 
    # but for reads we should check it too.
    if order.restaurant.owner_id != current_user.id:
        from app.core.exceptions import PermissionDeniedError
        raise PermissionDeniedError()
        
    return service._build_detail_response(order)


@router.patch(
    "/{order_id}/accept",
    response_model=OrderDetailResponse,
    summary="Accept an order",
)
async def accept_order(
    order_id: uuid.UUID,
    current_user: OwnerUser,
    db: DbSession,
):
    service = OrderService(db)
    return await service.owner_accept_order(current_user.id, order_id)


@router.patch(
    "/{order_id}/reject",
    response_model=OrderDetailResponse,
    summary="Reject an order",
)
async def reject_order(
    order_id: uuid.UUID,
    payload: OrderRejectPayload,
    current_user: OwnerUser,
    db: DbSession,
):
    service = OrderService(db)
    return await service.owner_reject_order(current_user.id, order_id, payload.reason)


@router.patch(
    "/{order_id}/status",
    response_model=OrderDetailResponse,
    summary="Update order status (e.g. preparing, ready)",
)
async def update_status(
    order_id: uuid.UUID,
    new_status: OrderStatus,
    current_user: OwnerUser,
    db: DbSession,
):
    service = OrderService(db)
    return await service.owner_update_status(current_user.id, order_id, new_status)
