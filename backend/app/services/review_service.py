import uuid
from datetime import datetime, timedelta, timezone
from typing import Sequence, Tuple, Dict, Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import SwigatoException, PermissionDeniedError, NotFoundError
from app.models.order import Order
from app.models.restaurant import Restaurant
from app.models.review import Review
from app.repositories.review_repo import ReviewRepository
from app.repositories.order_repo import OrderRepository
from app.repositories.restaurant_repo import RestaurantRepository
from app.schemas.review import ReviewCreate, ReviewUpdate, OwnerReplyUpdate, ReviewResponse, ReviewSummaryResponse


class ReviewService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.review_repo = ReviewRepository(session)
        self.order_repo = OrderRepository(session)
        self.restaurant_repo = RestaurantRepository(session)

    async def _recalculate_restaurant_aggregation(self, restaurant_id: uuid.UUID) -> None:
        """
        Recalculates and updates the average_rating and total_reviews for a restaurant.
        Must be called within an active transaction.
        """
        # Lock restaurant row for update
        stmt = select(Restaurant).where(Restaurant.id == restaurant_id).with_for_update()
        restaurant = await self.session.scalar(stmt)
        if not restaurant:
            return

        distribution = await self.review_repo.get_rating_distribution(restaurant_id)
        
        restaurant.average_rating = distribution["average_rating"]
        restaurant.total_reviews = distribution["total_reviews"]

    async def create_review(self, user_id: int, data: ReviewCreate) -> ReviewResponse:
        # Check order
        order = await self.order_repo.get_by_id(data.order_id)
        if not order:
            raise NotFoundError("Order not found")
        
        if order.customer_id != user_id:
            raise PermissionDeniedError("You can only review your own orders")
            
        if order.status != "delivered" and order.delivered_at is None:
            raise SwigatoException("You can only review orders that have been delivered", status_code=400)
            
        # Check duplicate
        existing = await self.review_repo.get_by_order_id(order.id)
        if existing:
            raise SwigatoException("You have already reviewed this order", status_code=400)
            
        # Create review
        review = await self.review_repo.create(
            customer_id=user_id,
            restaurant_id=order.restaurant_id,
            order_id=order.id,
            rating=data.rating,
            title=data.title,
            comment=data.comment
        )
        
        # Flush to DB so the distribution query sees it
        await self.session.flush()
        
        # Update restaurant aggregates within transaction
        await self._recalculate_restaurant_aggregation(order.restaurant_id)
        
        await self.session.commit()
        await self.session.refresh(review)
        
        # Reload with customer for response
        stmt = select(Review).where(Review.id == review.id).options(selectinload(Review.customer))
        review_with_customer = await self.session.scalar(stmt)
        
        return ReviewResponse.model_validate(review_with_customer)

    async def update_review(self, user_id: int, review_id: uuid.UUID, data: ReviewUpdate) -> ReviewResponse:
        review = await self.review_repo.get_by_id(review_id)
        if not review:
            raise NotFoundError("Review not found")
            
        if review.customer_id != user_id:
            raise PermissionDeniedError("You can only edit your own reviews")
            
        # Check 7-day edit window
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        if review.created_at < seven_days_ago:
            raise SwigatoException("Reviews cannot be edited after 7 days", status_code=400)
            
        update_data = data.model_dump(exclude_unset=True)
        if update_data:
            update_data["is_edited"] = True
            review = await self.review_repo.update(review, **update_data)
            
            # Recalculate if rating changed
            if "rating" in update_data:
                await self.session.flush()
                await self._recalculate_restaurant_aggregation(review.restaurant_id)
                
            await self.session.commit()
            
        # Reload with customer
        stmt = select(Review).where(Review.id == review.id).options(selectinload(Review.customer))
        review_with_customer = await self.session.scalar(stmt)
            
        return ReviewResponse.model_validate(review_with_customer)

    async def delete_review(self, user_id: int, review_id: uuid.UUID) -> None:
        review = await self.review_repo.get_by_id(review_id)
        if not review:
            raise NotFoundError("Review not found")
            
        if review.customer_id != user_id:
            raise PermissionDeniedError("You can only delete your own reviews")
            
        restaurant_id = review.restaurant_id
        await self.review_repo.delete(review.id)
        
        # Recalculate aggregates
        await self.session.flush()
        await self._recalculate_restaurant_aggregation(restaurant_id)
        
        await self.session.commit()

    async def reply_to_review(self, owner_id: int, review_id: uuid.UUID, data: OwnerReplyUpdate) -> ReviewResponse:
        review = await self.review_repo.get_by_id(review_id)
        if not review:
            raise NotFoundError("Review not found")
            
        if review.is_hidden:
            raise SwigatoException("Cannot reply to a hidden review", status_code=400)
            
        restaurant = await self.restaurant_repo.get_by_id(review.restaurant_id)
        if not restaurant or restaurant.owner_id != owner_id:
            raise PermissionDeniedError("You do not own the restaurant for this review")
            
        from sqlalchemy.sql import func
        review = await self.review_repo.update(
            review, 
            owner_reply=data.owner_reply,
            owner_reply_at=func.now()
        )
        await self.session.commit()
        
        # Reload with customer
        stmt = select(Review).where(Review.id == review.id).options(selectinload(Review.customer))
        review_with_customer = await self.session.scalar(stmt)
        
        return ReviewResponse.model_validate(review_with_customer)

    async def moderate_review(self, admin_id: int, review_id: uuid.UUID, is_hidden: bool) -> ReviewResponse:
        review = await self.review_repo.get_by_id(review_id)
        if not review:
            raise NotFoundError("Review not found")
            
        review = await self.review_repo.update(
            review,
            is_hidden=is_hidden,
            moderated_by=admin_id
        )
        
        # Recalculate if hidden state changed
        await self.session.flush()
        await self._recalculate_restaurant_aggregation(review.restaurant_id)
        
        await self.session.commit()
        
        # Reload with customer
        stmt = select(Review).where(Review.id == review.id).options(selectinload(Review.customer))
        review_with_customer = await self.session.scalar(stmt)
        
        return ReviewResponse.model_validate(review_with_customer)

    async def get_restaurant_summary(self, restaurant_id: uuid.UUID) -> ReviewSummaryResponse:
        restaurant = await self.restaurant_repo.get_by_id(restaurant_id)
        if not restaurant:
            raise NotFoundError("Restaurant not found")
            
        distribution = await self.review_repo.get_rating_distribution(restaurant_id)
        return ReviewSummaryResponse.model_validate(distribution)
