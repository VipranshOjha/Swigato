import uuid
from typing import Sequence, Tuple, Dict, Any

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.review import Review
from app.repositories.base import BaseRepository


class ReviewRepository(BaseRepository[Review]):
    model = Review

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session)

    async def get_by_order_id(self, order_id: uuid.UUID) -> Review | None:
        stmt = select(Review).where(Review.order_id == order_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_restaurant(
        self, restaurant_id: uuid.UUID, limit: int = 20, offset: int = 0, sort_by: str = "newest"
    ) -> Tuple[Sequence[Review], int]:
        
        base_query = select(Review).where(
            and_(
                Review.restaurant_id == restaurant_id,
                Review.is_hidden == False,
                Review.deleted_at.is_(None)
            )
        )
        
        # Count query
        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = await self.session.scalar(count_stmt) or 0
        
        # Data query
        stmt = base_query.options(selectinload(Review.customer))
        
        if sort_by == "highest_rating":
            stmt = stmt.order_by(Review.rating.desc(), Review.created_at.desc())
        elif sort_by == "lowest_rating":
            stmt = stmt.order_by(Review.rating.asc(), Review.created_at.desc())
        else:
            stmt = stmt.order_by(Review.created_at.desc())
            
        stmt = stmt.limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        return result.scalars().all(), total

    async def list_by_customer(
        self, customer_id: int, limit: int = 20, offset: int = 0
    ) -> Tuple[Sequence[Review], int]:
        
        base_query = select(Review).where(
            and_(
                Review.customer_id == customer_id,
                Review.deleted_at.is_(None)
            )
        )
        
        # Count query
        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = await self.session.scalar(count_stmt) or 0
        
        # Data query
        stmt = base_query.options(
            selectinload(Review.restaurant),
        ).order_by(Review.created_at.desc()).limit(limit).offset(offset)
        
        result = await self.session.execute(stmt)
        return result.scalars().all(), total

    async def get_rating_distribution(self, restaurant_id: uuid.UUID) -> Dict[str, Any]:
        stmt = select(
            Review.rating,
            func.count(Review.id).label("count")
        ).where(
            and_(
                Review.restaurant_id == restaurant_id,
                Review.is_hidden == False,
                Review.deleted_at.is_(None)
            )
        ).group_by(Review.rating)
        
        result = await self.session.execute(stmt)
        distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        total_reviews = 0
        total_score = 0
        
        for row in result:
            rating = row.rating
            count = row.count
            distribution[rating] = count
            total_reviews += count
            total_score += (rating * count)
            
        avg_rating = round(total_score / total_reviews, 2) if total_reviews > 0 else 0.0
        
        return {
            "restaurant_id": restaurant_id,
            "average_rating": avg_rating,
            "total_reviews": total_reviews,
            "five_star": distribution[5],
            "four_star": distribution[4],
            "three_star": distribution[3],
            "two_star": distribution[2],
            "one_star": distribution[1],
        }

    async def list_for_owner_restaurants(
        self, owner_id: int, limit: int = 20, offset: int = 0
    ) -> Tuple[Sequence[Review], int]:
        from app.models.restaurant import Restaurant
        
        # Subquery to find all restaurants owned by the user
        owned_restaurants_subq = select(Restaurant.id).where(Restaurant.owner_id == owner_id).subquery()
        
        base_query = select(Review).where(
            and_(
                Review.restaurant_id.in_(owned_restaurants_subq),
                Review.deleted_at.is_(None)
            )
        )
        
        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = await self.session.scalar(count_stmt) or 0
        
        stmt = base_query.options(
            selectinload(Review.customer),
            selectinload(Review.restaurant)
        ).order_by(Review.created_at.desc()).limit(limit).offset(offset)
        
        result = await self.session.execute(stmt)
        return result.scalars().all(), total

    async def list_all_for_admin(
        self, limit: int = 20, offset: int = 0
    ) -> Tuple[Sequence[Review], int]:
        base_query = select(Review).where(Review.deleted_at.is_(None))
        
        count_stmt = select(func.count()).select_from(base_query.subquery())
        total = await self.session.scalar(count_stmt) or 0
        
        stmt = base_query.options(
            selectinload(Review.customer),
            selectinload(Review.restaurant),
            selectinload(Review.moderator)
        ).order_by(Review.created_at.desc()).limit(limit).offset(offset)
        
        result = await self.session.execute(stmt)
        return result.scalars().all(), total
