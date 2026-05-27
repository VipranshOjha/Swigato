"""
app/api/v1/admin/delivery_partners.py
─────────────────────────────────────
Endpoints for platform administrators to manage delivery partners.
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.constants import UserRole
from app.dependencies.admin import AdminUser, require_roles
from app.database import DbSession
from app.schemas.common import PaginatedResponse
from app.schemas.delivery import DeliveryPartnerAdminResponse
from app.services.delivery_service import DeliveryService

router = APIRouter(
    prefix="/delivery-partners",
    tags=["Admin Delivery Partners"],
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
)


@router.get(
    "",
    response_model=PaginatedResponse[DeliveryPartnerAdminResponse],
    summary="List all delivery partners",
)
async def list_delivery_partners(
    current_user: AdminUser,
    db: DbSession,
    is_verified: Optional[bool] = Query(None, description="Filter by verification status"),
    is_online: Optional[bool] = Query(None, description="Filter by online status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = DeliveryService(db)
    items, total = await service.admin_list_partners(
        is_verified=is_verified, is_online=is_online, page=page, page_size=page_size
    )
    return PaginatedResponse.create(items, total, page, page_size)


@router.patch(
    "/{profile_id}/verify",
    response_model=DeliveryPartnerAdminResponse,
    summary="Verify or unverify a delivery partner",
)
async def verify_partner(
    profile_id: uuid.UUID,
    verify: bool,
    current_user: AdminUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.admin_verify_partner(profile_id, verify)


@router.patch(
    "/{profile_id}/suspend",
    response_model=DeliveryPartnerAdminResponse,
    summary="Suspend or unsuspend a delivery partner",
)
async def suspend_partner(
    profile_id: uuid.UUID,
    suspend: bool,
    current_user: AdminUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.admin_suspend_partner(profile_id, suspend)
