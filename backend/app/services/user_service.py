from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.user import UpdateProfileRequest


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    async def get_user_by_id(self, user_id: int) -> User:
        user = await self.user_repo.get_by_id_with_roles(user_id)
        if not user or user.is_deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user

    async def update_profile(self, user_id: int, profile_data: UpdateProfileRequest) -> User:
        user = await self.get_user_by_id(user_id)

        update_dict = profile_data.model_dump(exclude_unset=True)

        # Check uniqueness if email or phone is changing
        if "email" in update_dict and update_dict["email"] != user.email:
            existing = await self.user_repo.get_by_email(update_dict["email"])
            if existing and existing.id != user_id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
            
            # Require re-verification
            update_dict["is_email_verified"] = False
            update_dict["email_verified_at"] = None

        if "phone" in update_dict and update_dict["phone"] != user.phone:
            existing = await self.user_repo.get_by_phone(update_dict["phone"])
            if existing and existing.id != user_id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already registered")

        user = await self.user_repo.update(user, **update_dict)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def soft_delete_user(self, user_id: int) -> None:
        user = await self.get_user_by_id(user_id)
        user.soft_delete()
        user.is_active = False
        await self.session.commit()
