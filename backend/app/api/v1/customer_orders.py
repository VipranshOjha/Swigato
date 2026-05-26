"""
app/api/v1/customer_orders.py
─────────────────────────────
Endpoints for customers to manage their orders.
"""
import uuid

from fastapi import APIRouter, Depends, Query, status

from app.core.constants import UserRole
from app.core.permissions import AuthUser, require_roles
from app.database import DbSession
from app.schemas.common import PaginatedResponse
from app.schemas.order import OrderCreate, OrderDetailResponse, OrderResponse
from app.services.order_service import OrderService

router = APIRouter(
    prefix="/orders",
    tags=["Customer Orders"],
    dependencies=[Depends(require_roles(UserRole.CUSTOMER))],
)


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an order from cart",
)
async def create_order(
    payload: OrderCreate,
    current_user: AuthUser,
    db: DbSession,
):
    service = OrderService(db)
    return await service.create_order(current_user.id, payload)


@router.get(
    "",
    response_model=PaginatedResponse[OrderResponse],
    summary="List customer orders",
)
async def list_orders(
    current_user: AuthUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = OrderService(db)
    items, total = await service.get_customer_orders(
        current_user.id, page=page, page_size=page_size
    )
    return PaginatedResponse.create(items, total, page, page_size)


@router.get(
    "/{order_id}",
    response_model=OrderDetailResponse,
    summary="Get order details",
)
async def get_order(
    order_id: uuid.UUID,
    current_user: AuthUser,
    db: DbSession,
):
    service = OrderService(db)
    return await service.get_customer_order_detail(current_user.id, order_id)


@router.patch(
    "/{order_id}/cancel",
    response_model=OrderDetailResponse,
    summary="Cancel an order",
)
async def cancel_order(
    order_id: uuid.UUID,
    current_user: AuthUser,
    db: DbSession,
):
    service = OrderService(db)
    return await service.cancel_order(current_user.id, order_id)
