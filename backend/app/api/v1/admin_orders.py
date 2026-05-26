"""
app/api/v1/admin_orders.py
──────────────────────────
Endpoints for platform administrators to view and manage orders.
"""
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.constants import UserRole
from app.core.permissions import AdminUser, require_roles
from app.database import DbSession
from app.schemas.common import PaginatedResponse
from app.schemas.order import OrderDetailResponse, OrderResponse
from app.services.order_service import OrderService

router = APIRouter(
    prefix="/orders",
    tags=["Admin Orders"],
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
)


@router.get(
    "",
    response_model=PaginatedResponse[OrderResponse],
    summary="List all platform orders",
)
async def list_all_orders(
    current_user: AdminUser,
    db: DbSession,
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    restaurant_id: Optional[uuid.UUID] = Query(None, description="Filter by restaurant"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = OrderService(db)
    offset = (page - 1) * page_size
    items, total = await service.order_repo.list_all(
        status_filter=status_filter,
        restaurant_filter=restaurant_id,
        customer_filter=customer_id,
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
    current_user: AdminUser,
    db: DbSession,
):
    service = OrderService(db)
    order = await service._get_order(order_id)
    return service._build_detail_response(order)
