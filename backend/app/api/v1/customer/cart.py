import uuid

from fastapi import APIRouter, Depends, status
from app.database import DbSession
from app.dependencies.auth import AuthUser, require_roles
from app.constants import UserRole
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartResponse
from app.services.cart_service import CartService

router = APIRouter(
    prefix="/cart",
    tags=["Cart Management"],
    dependencies=[Depends(require_roles(UserRole.CUSTOMER))]
)

@router.get(
    "",
    response_model=CartResponse,
    summary="Get user's current cart",
)
async def get_cart(
    db: DbSession,
    current_user: AuthUser,
):
    service = CartService(db)
    return await service.get_cart(current_user.id)


@router.post(
    "/items",
    response_model=CartResponse,
    summary="Add an item to the cart",
)
async def add_item_to_cart(
    payload: CartItemAdd,
    db: DbSession,
    current_user: AuthUser,
):
    service = CartService(db)
    return await service.add_item(current_user.id, payload)


@router.patch(
    "/items/{menu_item_id}",
    response_model=CartResponse,
    summary="Update quantity of an item in the cart",
)
async def update_cart_item(
    menu_item_id: uuid.UUID,
    payload: CartItemUpdate,
    db: DbSession,
    current_user: AuthUser,
):
    service = CartService(db)
    return await service.update_quantity(current_user.id, menu_item_id, payload.quantity)


@router.delete(
    "/items/{menu_item_id}",
    response_model=CartResponse,
    summary="Remove an item from the cart",
)
async def remove_cart_item(
    menu_item_id: uuid.UUID,
    db: DbSession,
    current_user: AuthUser,
):
    service = CartService(db)
    return await service.remove_item(current_user.id, menu_item_id)


@router.delete(
    "",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear the entire cart",
)
async def clear_cart(
    db: DbSession,
    current_user: AuthUser,
):
    service = CartService(db)
    await service.clear_cart(current_user.id)
