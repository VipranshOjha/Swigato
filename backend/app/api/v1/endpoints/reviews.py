import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import AuthUser, require_roles
from app.constants import UserRole
from app.database import DbSession
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse
from app.services.review_service import ReviewService
from app.repositories.review_repo import ReviewRepository

router = APIRouter(dependencies=[Depends(require_roles(UserRole.CUSTOMER))])


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    data: ReviewCreate,
    current_user: AuthUser,
    db: DbSession,
):
    """Create a new review for a completed order."""
    service = ReviewService(db)
    return await service.create_review(current_user.id, data)


@router.get("/me", response_model=PaginatedResponse[ReviewResponse])
async def list_my_reviews(
    current_user: AuthUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List reviews created by the authenticated customer."""
    repo = ReviewRepository(db)
    offset = (page - 1) * page_size
    items, total = await repo.list_by_customer(current_user.id, limit=page_size, offset=offset)
    
    return PaginatedResponse.create(
        items=[ReviewResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.patch("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: uuid.UUID,
    data: ReviewUpdate,
    current_user: AuthUser,
    db: DbSession,
):
    """Update an existing review within 7 days of creation."""
    service = ReviewService(db)
    return await service.update_review(current_user.id, review_id, data)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: uuid.UUID,
    current_user: AuthUser,
    db: DbSession,
):
    """Delete a review."""
    service = ReviewService(db)
    await service.delete_review(current_user.id, review_id)
