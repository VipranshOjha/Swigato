import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import DbSession
from app.dependencies.owner import OwnerUser
from app.constants import UserRole
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.review import OwnerReplyUpdate, ReviewResponse
from app.services.review_service import ReviewService
from app.repositories.review_repo import ReviewRepository

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[ReviewResponse])
async def list_restaurant_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: OwnerUser = None,
    db: DbSession = None,
):
    """List all reviews for all restaurants owned by the current user."""
    repo = ReviewRepository(db)
    offset = (page - 1) * page_size
    items, total = await repo.list_for_owner_restaurants(current_user.id, limit=page_size, offset=offset)
    
    return PaginatedResponse.create(
        items=[ReviewResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/{review_id}/reply", response_model=ReviewResponse)
async def reply_to_review(
    review_id: uuid.UUID,
    data: OwnerReplyUpdate,
    current_user: OwnerUser = None,
    db: DbSession = None,
):
    """Add or update an owner reply to a review."""
    service = ReviewService(db)
    return await service.reply_to_review(current_user.id, review_id, data)
