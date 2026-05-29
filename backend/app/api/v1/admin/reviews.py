import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import DbSession
from app.dependencies.admin import AdminUser
from app.constants import UserRole
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.review import ReviewResponse
from app.services.review_service import ReviewService
from app.repositories.review_repo import ReviewRepository

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[ReviewResponse])
async def list_all_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: AdminUser = None,
    db: DbSession = None,
):
    """List all reviews for moderation purposes."""
    repo = ReviewRepository(db)
    offset = (page - 1) * page_size
    items, total = await repo.list_all_for_admin(limit=page_size, offset=offset)
    
    return PaginatedResponse.create(
        items=[ReviewResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/{review_id}/moderate", response_model=ReviewResponse)
async def moderate_review(
    review_id: uuid.UUID,
    is_hidden: bool = Query(..., description="Set to true to hide the review"),
    current_user: AdminUser = None,
    db: DbSession = None,
):
    """Hide or unhide a review for moderation purposes."""
    service = ReviewService(db)
    return await service.moderate_review(current_user.id, review_id, is_hidden)
