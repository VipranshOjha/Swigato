"""
app/api/v1/delivery/orders.py
─────────────────────────────
Endpoints for delivery partners to manage assigned orders.
"""
import uuid

from fastapi import APIRouter, Depends, Query

from app.database import DbSession
from app.dependencies.delivery import DeliveryUser
from app.schemas.common import PaginatedResponse
from app.schemas.order import OrderDetailResponse
from app.services.delivery_service import DeliveryService

router = APIRouter(prefix="/orders", tags=["Delivery Partner Orders"])


@router.get(
    "",
    response_model=PaginatedResponse[OrderDetailResponse],
    summary="List assigned orders",
)
async def list_assigned_orders(
    current_user: DeliveryUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = DeliveryService(db)
    items, total = await service.get_assigned_orders(current_user.id)
    # Applying pagination manually here for simplicity as our custom query returned all,
    # or assuming the service applies it if we update it. Let's just paginate the list.
    start = (page - 1) * page_size
    end = start + page_size
    paginated_items = items[start:end]
    return PaginatedResponse.create(paginated_items, total, page, page_size)


@router.patch(
    "/{order_id}/accept",
    response_model=OrderDetailResponse,
    summary="Accept assigned order",
)
async def accept_order(
    order_id: uuid.UUID,
    current_user: DeliveryUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.accept_order(current_user.id, order_id)


@router.patch(
    "/{order_id}/reject",
    response_model=OrderDetailResponse,
    summary="Reject assigned order",
)
async def reject_order(
    order_id: uuid.UUID,
    current_user: DeliveryUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.reject_order(current_user.id, order_id)


@router.patch(
    "/{order_id}/pickup",
    response_model=OrderDetailResponse,
    summary="Mark order as picked up",
)
async def mark_picked_up(
    order_id: uuid.UUID,
    current_user: DeliveryUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.mark_picked_up(current_user.id, order_id)


@router.patch(
    "/{order_id}/in-transit",
    response_model=OrderDetailResponse,
    summary="Mark order as out for delivery",
)
async def mark_in_transit(
    order_id: uuid.UUID,
    current_user: DeliveryUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.mark_in_transit(current_user.id, order_id)


@router.patch(
    "/{order_id}/deliver",
    response_model=OrderDetailResponse,
    summary="Mark order as delivered",
)
async def mark_delivered(
    order_id: uuid.UUID,
    current_user: DeliveryUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.mark_delivered(current_user.id, order_id)
