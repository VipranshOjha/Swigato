"""
app/services/order_service.py
─────────────────────────────
Business logic for order creation and state transitions.
"""
import uuid
from datetime import datetime, timezone
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import ORDER_TRANSITIONS, OrderStatus, UserRole
from app.core.exceptions import (
    InvalidOrderStateTransitionError,
    OrderNotFoundError,
    PermissionDeniedError,
)
from app.models.order import Order
from app.repositories.address_repo import AddressRepository
from app.repositories.cart_repo import CartRepository
from app.repositories.order_repo import (
    OrderItemRepository,
    OrderRepository,
    OrderStatusHistoryRepository,
)
from app.schemas.order import OrderCreate, OrderDetailResponse, OrderResponse


class OrderService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.order_repo = OrderRepository(session)
        self.item_repo = OrderItemRepository(session)
        self.history_repo = OrderStatusHistoryRepository(session)
        self.cart_repo = CartRepository(session)
        self.address_repo = AddressRepository(session)

    # Internal Helpers

    async def _get_order(self, order_id: uuid.UUID) -> Order:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise OrderNotFoundError()
        return order

    async def _transition_state(
        self,
        order: Order,
        new_status: OrderStatus,
        changed_by: int | None = None,
        notes: str | None = None,
        **kwargs,
    ) -> Order:
        """Validates transition and updates status with history."""
        old_status_str = order.status
        try:
            old_status = OrderStatus(old_status_str)
        except ValueError:
            raise InvalidOrderStateTransitionError(
                f"Unknown current status: {old_status_str}"
            )

        allowed_next = ORDER_TRANSITIONS.get(old_status, set())
        if new_status not in allowed_next:
            raise InvalidOrderStateTransitionError(
                f"Cannot transition from {old_status.value} to {new_status.value}"
            )

        # Update order
        order = await self.order_repo.update_status(
            order, new_status.value, **kwargs
        )

        # Record history
        await self.history_repo.create(
            order_id=order.id,
            old_status=old_status.value,
            new_status=new_status.value,
            changed_by=changed_by,
            notes=notes,
        )
        return order

    def _build_response(self, order: Order) -> OrderResponse:
        return OrderResponse.model_validate(order)

    def _build_detail_response(self, order: Order) -> OrderDetailResponse:
        return OrderDetailResponse.model_validate(order)

    # Customer Actions

    async def create_order(self, customer_id: int, payload: OrderCreate) -> OrderResponse:
        """Create an order from the user's cart."""
        cart = await self.cart_repo.get_cart_by_user_id(customer_id)
        if not cart or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty."
            )
        if not cart.restaurant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart has no associated restaurant.",
            )

        # Validate Address
        address = await self.address_repo.get_by_id_and_user_id(
            payload.delivery_address_id, customer_id
        )
        if not address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid delivery address.",
            )

        # Calculate Totals
        subtotal = 0.0
        items_data = []
        for item in cart.items:
            price = float(item.menu_item.price)
            item_total = price * item.quantity
            subtotal += item_total
            items_data.append(
                {
                    "menu_item_id": item.menu_item_id,
                    "item_name": item.menu_item.name,
                    "quantity": item.quantity,
                    "unit_price": price,
                    "total_price": item_total,
                }
            )

        # standard fees matching cart logic
        delivery_fee = 50.0
        if cart.restaurant.base_delivery_fee:
            delivery_fee = float(cart.restaurant.base_delivery_fee)
            if cart.restaurant.free_delivery_above and subtotal >= cart.restaurant.free_delivery_above:
                delivery_fee = 0.0

        tax_amount = round(subtotal * 0.05, 2)
        total_amount = subtotal + delivery_fee + tax_amount

        # Create Order (defaults to PENDING)
        order = await self.order_repo.create(
            customer_id=customer_id,
            restaurant_id=cart.restaurant_id,
            delivery_address_id=payload.delivery_address_id,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            tax_amount=tax_amount,
            total_amount=total_amount,
            notes=payload.notes,
            status=OrderStatus.PENDING.value,
        )

        # Link order_id into items
        for idata in items_data:
            idata["order_id"] = order.id
        await self.item_repo.bulk_create(items_data)

        # Initial History
        await self.history_repo.create(
            order_id=order.id,
            old_status=None,
            new_status=OrderStatus.PENDING.value,
            changed_by=customer_id,
            notes="Order created from cart",
        )

        # Clear Cart
        await self.cart_repo.clear_cart(cart.id)
        await self.session.commit()

        # Reload fully
        order = await self._get_order(order.id)
        return self._build_response(order)

    async def get_customer_orders(
        self, customer_id: int, page: int = 1, page_size: int = 20
    ) -> tuple[Sequence[Order], int]:
        offset = (page - 1) * page_size
        return await self.order_repo.list_by_customer(
            customer_id, limit=page_size, offset=offset
        )

    async def get_customer_order_detail(
        self, customer_id: int, order_id: uuid.UUID
    ) -> OrderDetailResponse:
        order = await self._get_order(order_id)
        if order.customer_id != customer_id:
            raise PermissionDeniedError()
        return self._build_detail_response(order)

    async def cancel_order(self, customer_id: int, order_id: uuid.UUID) -> OrderDetailResponse:
        order = await self._get_order(order_id)
        if order.customer_id != customer_id:
            raise PermissionDeniedError()
        
        # In a real app, cancellation might only be allowed if PENDING or PLACED
        order = await self._transition_state(
            order, OrderStatus.CANCELLED, changed_by=customer_id
        )
        await self.session.commit()
        await self.session.refresh(order, ["status_history", "updated_at"])
        return self._build_detail_response(order)

    # Owner Actions

    async def owner_accept_order(self, owner_id: int, order_id: uuid.UUID) -> OrderDetailResponse:
        order = await self._get_order(order_id)
        if order.restaurant.owner_id != owner_id:
            raise PermissionDeniedError()

        order = await self._transition_state(
            order, OrderStatus.ACCEPTED, changed_by=owner_id
        )
        await self.session.commit()
        await self.session.refresh(order, ["status_history", "updated_at"])
        return self._build_detail_response(order)

    async def owner_reject_order(
        self, owner_id: int, order_id: uuid.UUID, reason: str
    ) -> OrderDetailResponse:
        order = await self._get_order(order_id)
        if order.restaurant.owner_id != owner_id:
            raise PermissionDeniedError()

        order = await self._transition_state(
            order,
            OrderStatus.REJECTED,
            changed_by=owner_id,
            notes=reason,
            rejection_reason=reason,
        )
        await self.session.commit()
        await self.session.refresh(order, ["status_history", "updated_at"])
        return self._build_detail_response(order)

    async def owner_update_status(
        self, owner_id: int, order_id: uuid.UUID, new_status: OrderStatus
    ) -> OrderDetailResponse:
        order = await self._get_order(order_id)
        if order.restaurant.owner_id != owner_id:
            raise PermissionDeniedError()
        
        # Only certain transitions are typically driven by the owner (e.g. PREPARING, READY_FOR_PICKUP)
        order = await self._transition_state(order, new_status, changed_by=owner_id)
        await self.session.commit()
        
        # Auto-assign a rider if the order is ready for pickup
        if new_status == OrderStatus.READY_FOR_PICKUP:
            from app.services.delivery_service import DeliveryService
            delivery_service = DeliveryService(self.session)
            assigned = await delivery_service.auto_assign_order(order.id)
            if assigned:
                # Auto-transition to rider assigned
                order = await self._transition_state(order, OrderStatus.RIDER_ASSIGNED, changed_by=owner_id)
                await self.session.commit()

        await self.session.refresh(order, ["status_history", "updated_at"])
        return self._build_detail_response(order)
