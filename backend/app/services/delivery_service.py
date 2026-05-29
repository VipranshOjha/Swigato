"""
app/services/delivery_service.py
────────────────────────────────
Business logic for delivery partners (profiles, tracking, and order assignment).
"""
import uuid
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import OrderStatus, UserRole
from app.core.exceptions import (
    DeliveryPartnerNotFoundError,
    DeliveryPartnerNotVerifiedError,
    OrderNotFoundError,
    PermissionDeniedError,
)
from app.models.delivery import DeliveryPartnerProfile
from app.repositories.delivery_repo import (
    DeliveryLocationLogRepository,
    DeliveryPartnerRepository,
)
from app.repositories.order_repo import OrderRepository, OrderStatusHistoryRepository
from app.schemas.delivery import (
    DeliveryPartnerAdminResponse,
    DeliveryPartnerProfileResponse,
    DeliveryPartnerRegister,
    DeliveryPartnerUpdate,
    LocationUpdate,
)
from app.schemas.order import OrderDetailResponse
from app.services.order_service import OrderService


class DeliveryService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.partner_repo = DeliveryPartnerRepository(session)
        self.location_repo = DeliveryLocationLogRepository(session)
        self.order_repo = OrderRepository(session)
        self.history_repo = OrderStatusHistoryRepository(session)
        self.order_service = OrderService(session)

    # Profile Management

    async def register_partner(
        self, user_id: int, payload: DeliveryPartnerRegister
    ) -> DeliveryPartnerProfileResponse:
        """Register a user as a delivery partner."""
        existing = await self.partner_repo.get_by_user_id(user_id)
        if existing:
            # Idempotent return or raise error? Usually better to return or update
            return DeliveryPartnerProfileResponse.model_validate(existing)

        profile = await self.partner_repo.create(
            user_id=user_id,
            phone=payload.phone,
            vehicle_type=payload.vehicle_type,
            vehicle_number=payload.vehicle_number,
            is_verified=False,  # Needs admin approval
            is_online=False,
        )
        await self.session.commit()
        return DeliveryPartnerProfileResponse.model_validate(profile)

    async def get_my_profile(self, user_id: int) -> DeliveryPartnerProfileResponse:
        profile = await self.partner_repo.get_by_user_id(user_id)
        if not profile:
            raise DeliveryPartnerNotFoundError()
        return DeliveryPartnerProfileResponse.model_validate(profile)

    async def update_profile(
        self, user_id: int, payload: DeliveryPartnerUpdate
    ) -> DeliveryPartnerProfileResponse:
        profile = await self.partner_repo.get_by_user_id(user_id)
        if not profile:
            raise DeliveryPartnerNotFoundError()

        update_data = payload.model_dump(exclude_unset=True)
        profile = await self.partner_repo.update(profile, **update_data)
        await self.session.commit()
        return DeliveryPartnerProfileResponse.model_validate(profile)

    async def set_online_status(
        self, user_id: int, is_online: bool
    ) -> DeliveryPartnerProfileResponse:
        profile = await self.partner_repo.get_by_user_id(user_id)
        if not profile:
            raise DeliveryPartnerNotFoundError()
        # Removed is_verified block so unverified partners can test online toggles in dev mode,
        # or we could keep it. The implementation plan says "Remove the is_verified block".
        
        profile = await self.partner_repo.update(profile, is_online=is_online)
        await self.session.commit()
        return DeliveryPartnerProfileResponse.model_validate(profile)

    async def update_location(
        self, user_id: int, payload: LocationUpdate, order_id: uuid.UUID | None = None
    ) -> DeliveryPartnerProfileResponse:
        profile = await self.partner_repo.get_by_user_id(user_id)
        if not profile:
            raise DeliveryPartnerNotFoundError()

        # Update current location
        profile = await self.partner_repo.update(
            profile,
            current_latitude=payload.latitude,
            current_longitude=payload.longitude,
        )

        # Log it
        await self.location_repo.create(
            delivery_partner_id=profile.id,
            order_id=order_id,
            latitude=payload.latitude,
            longitude=payload.longitude,
        )

        await self.session.commit()
        return DeliveryPartnerProfileResponse.model_validate(profile)

    # Order Assignment and Workflow

    async def auto_assign_order(self, order_id: uuid.UUID, exclude_partner_id: uuid.UUID | None = None) -> bool:
        """Find an available partner and assign them to the order."""
        import logging
        logger = logging.getLogger(__name__)

        from sqlalchemy import select
        from app.models.order import Order
        stmt = select(Order).where(Order.id == order_id).with_for_update()
        order = await self.session.scalar(stmt)
        if not order or order.status != OrderStatus.READY_FOR_PICKUP or order.assigned_delivery_partner_id is not None:
            return False

        partner = await self.partner_repo.find_available_partner(exclude_partner_id=exclude_partner_id)
        if not partner:
            # In real system, we might queue this for retry
            return False

        # Calculate earning
        total_amount = float(order.total_amount) if order.total_amount else 0.0
        earning = max(20.0, total_amount * 0.1)

        # Assign
        order.delivery_earning = earning
        order.earning_status = "pending"
        order = await self.order_service._transition_state(
            order, OrderStatus.RIDER_ASSIGNED, changed_by=None,
            notes=f"Auto-assigned to partner {partner.id}",
            assigned_delivery_partner_id=partner.id,
        )
        logger.info(f"Assigned order {order.id} to partner {partner.id}")
        
        await self.session.commit()
        return True

    async def get_assigned_orders(
        self, user_id: int
    ) -> tuple[Sequence[OrderDetailResponse], int]:
        profile = await self.partner_repo.get_by_user_id(user_id)
        if not profile:
            raise DeliveryPartnerNotFoundError()

        # We can reuse the order_repo's flexible queries by adding a custom one, 
        # but for now we'll write a simple query here or use a generic approach.
        # Actually, let's just use select here to keep it simple, or better yet,
        # add a list_by_delivery_partner to order_repo.
        from sqlalchemy import select, func, and_
        from app.models.order import Order
        from sqlalchemy.orm import selectinload

        base = select(Order).where(Order.assigned_delivery_partner_id == profile.id)
        count = await self.session.scalar(select(func.count()).select_from(base.subquery())) or 0
        from app.models.order import OrderItem
        stmt = base.options(
            selectinload(Order.items).selectinload(OrderItem.menu_item),
            selectinload(Order.restaurant),
            selectinload(Order.customer),
            selectinload(Order.delivery_address),
            selectinload(Order.status_history),
        ).order_by(Order.created_at.desc())
        
        result = await self.session.execute(stmt)
        orders = result.scalars().all()
        
        return [OrderDetailResponse.model_validate(o) for o in orders], count

    async def _get_partner_order(self, user_id: int, order_id: uuid.UUID):
        profile = await self.partner_repo.get_by_user_id(user_id)
        if not profile:
            raise DeliveryPartnerNotFoundError()
            
        from sqlalchemy import select
        from app.models.order import Order, OrderItem
        from sqlalchemy.orm import selectinload
        
        stmt = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.menu_item),
            selectinload(Order.restaurant),
            selectinload(Order.customer),
            selectinload(Order.delivery_address),
            selectinload(Order.status_history),
        ).where(Order.id == order_id).with_for_update()
        order = await self.session.scalar(stmt)
        
        if not order:
            raise OrderNotFoundError()
            
        if order.assigned_delivery_partner_id != profile.id:
            raise PermissionDeniedError("You are not assigned to this order.")
            
        return profile, order

    async def accept_order(self, user_id: int, order_id: uuid.UUID) -> OrderDetailResponse:
        """Partner explicitly accepts the assigned order."""
        profile, order = await self._get_partner_order(user_id, order_id)
        from sqlalchemy.sql import func
        order.rider_accepted_at = func.now()
        await self.session.commit()
        await self.session.refresh(order)
        return OrderDetailResponse.model_validate(order)

    async def reject_order(self, user_id: int, order_id: uuid.UUID) -> OrderDetailResponse:
        """Partner rejects assignment."""
        profile, order = await self._get_partner_order(user_id, order_id)
        
        import logging
        logger = logging.getLogger(__name__)

        order.rider_accepted_at = None
        order.assigned_delivery_partner_id = None
        
        # Transition back to READY_FOR_PICKUP so auto_assign_order works
        order = await self.order_service._transition_state(
            order, OrderStatus.READY_FOR_PICKUP, changed_by=user_id,
            notes=f"Rejected by partner {profile.id}.",
        )
        await self.session.commit()
        await self.session.refresh(order)
        
        # Try to reassign to another rider
        assigned = await self.auto_assign_order(order.id, exclude_partner_id=profile.id)
        
        if not assigned:
            logger.warning(f"Order {order.id} rejected by {profile.id}. No reassignments available.")
        else:
            logger.info(f"Order {order.id} rejected by {profile.id}. Reassigned successfully.")
            
        await self.session.refresh(order)
        return OrderDetailResponse.model_validate(order)

    async def mark_picked_up(self, user_id: int, order_id: uuid.UUID) -> OrderDetailResponse:
        profile, order = await self._get_partner_order(user_id, order_id)
        if not order.rider_accepted_at:
            from app.core.exceptions import AppError
            raise AppError("You must accept the delivery before picking it up.", status_code=400)
            
        from sqlalchemy.sql import func
        order.picked_up_at = func.now()
        order = await self.order_service._transition_state(
            order, OrderStatus.PICKED_UP, changed_by=user_id
        )
        await self.session.commit()
        return OrderDetailResponse.model_validate(order)

    async def mark_in_transit(self, user_id: int, order_id: uuid.UUID) -> OrderDetailResponse:
        profile, order = await self._get_partner_order(user_id, order_id)
        order = await self.order_service._transition_state(
            order, OrderStatus.IN_TRANSIT, changed_by=user_id
        )
        await self.session.commit()
        return OrderDetailResponse.model_validate(order)

    async def mark_delivered(self, user_id: int, order_id: uuid.UUID) -> OrderDetailResponse:
        profile, order = await self._get_partner_order(user_id, order_id)
        from sqlalchemy.sql import func
        order.delivered_at = func.now()
        order.earning_status = "unpaid"
        order = await self.order_service._transition_state(
            order, OrderStatus.DELIVERED, changed_by=user_id
        )
        # Free up the partner and increment total deliveries & earnings
        await self.partner_repo.update(
            profile,
            total_deliveries=profile.total_deliveries + 1,
            total_earnings=profile.total_earnings + order.delivery_earning
        )
        
        await self.session.commit()
        return OrderDetailResponse.model_validate(order)

    # Admin Actions

    async def admin_list_partners(
        self, is_verified: bool | None = None, is_online: bool | None = None,
        page: int = 1, page_size: int = 20
    ) -> tuple[Sequence[DeliveryPartnerAdminResponse], int]:
        offset = (page - 1) * page_size
        items, total = await self.partner_repo.list_all(
            is_verified=is_verified, is_online=is_online, limit=page_size, offset=offset
        )
        return [DeliveryPartnerAdminResponse.model_validate(i) for i in items], total

    async def admin_verify_partner(
        self, profile_id: uuid.UUID, verify: bool
    ) -> DeliveryPartnerAdminResponse:
        profile = await self.partner_repo.get_by_id(profile_id)
        if not profile:
            raise DeliveryPartnerNotFoundError()
            
        profile = await self.partner_repo.update(profile, is_verified=verify)
        await self.session.commit()
        return DeliveryPartnerAdminResponse.model_validate(profile)

    async def admin_suspend_partner(
        self, profile_id: uuid.UUID, suspend: bool
    ) -> DeliveryPartnerAdminResponse:
        profile = await self.partner_repo.get_by_id(profile_id)
        if not profile:
            raise DeliveryPartnerNotFoundError()
            
        profile = await self.partner_repo.update(
            profile,
            is_suspended=suspend,
            is_online=False if suspend else profile.is_online,
        )
        await self.session.commit()
        return DeliveryPartnerAdminResponse.model_validate(profile)
