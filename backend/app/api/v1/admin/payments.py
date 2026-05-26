"""
app/api/v1/admin_payments.py
─────────────────────────────
Endpoints for platform administrators to view payments.
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.constants import UserRole
from app.dependencies.admin import AdminUser, require_roles
from app.database import DbSession
from app.schemas.common import PaginatedResponse
from app.schemas.payment import PaymentDetailResponse
from app.services.payment_service import PaymentService

router = APIRouter(
    prefix="/payments",
    tags=["Admin Payments"],
    dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))],
)


@router.get(
    "",
    response_model=PaginatedResponse[PaymentDetailResponse],
    summary="List all platform payments",
)
async def list_all_payments(
    current_user: AdminUser,
    db: DbSession,
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    gateway_filter: Optional[str] = Query(None, description="Filter by gateway"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    service = PaymentService(db)
    items, total = await service.get_admin_payments(
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        gateway_filter=gateway_filter,
    )
    return PaginatedResponse.create(items, total, page, page_size)
