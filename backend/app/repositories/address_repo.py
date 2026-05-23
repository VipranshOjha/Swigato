from collections.abc import Sequence

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.address import Address
from app.repositories.base import BaseRepository


class AddressRepository(BaseRepository[Address]):
    model = Address

    def __init__(self, session: AsyncSession):
        super().__init__(session=session)

    async def get_by_user_id(self, user_id: int) -> Sequence[Address]:
        stmt = select(Address).where(Address.user_id == user_id).order_by(Address.is_default.desc(), Address.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_by_id_and_user_id(self, address_id: int, user_id: int) -> Address | None:
        stmt = select(Address).where(Address.id == address_id, Address.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def unset_default_for_user(self, user_id: int) -> None:
        """Sets is_default = False for all addresses belonging to a user."""
        stmt = (
            update(Address)
            .where(Address.user_id == user_id)
            .values(is_default=False)
        )
        await self.session.execute(stmt)
        await self.session.flush()

    async def delete_address(self, address: Address) -> None:
        """Hard delete an address."""
        await self.session.delete(address)
        await self.session.flush()
