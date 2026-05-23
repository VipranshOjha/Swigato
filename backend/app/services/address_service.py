from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.address import Address
from app.repositories.address_repo import AddressRepository
from app.schemas.address import AddressCreate, AddressUpdate


class AddressService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.address_repo = AddressRepository(session)

    async def create_address(self, user_id: int, address_in: AddressCreate) -> Address:
        # Check if setting default, then unset others
        if address_in.is_default:
            await self.address_repo.unset_default_for_user(user_id)
        else:
            # If it's the first address, make it default automatically
            existing = await self.address_repo.get_by_user_id(user_id)
            if not existing:
                address_in.is_default = True

        address_data = address_in.model_dump()
        address_data["user_id"] = user_id

        address = await self.address_repo.create(**address_data)
        await self.session.commit()
        await self.session.refresh(address)
        return address

    async def get_user_addresses(self, user_id: int) -> list[Address]:
        return await self.address_repo.get_by_user_id(user_id)

    async def update_address(self, address_id: int, user_id: int, address_in: AddressUpdate) -> Address:
        address = await self.address_repo.get_by_id_and_user_id(address_id, user_id)
        if not address:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

        update_data = address_in.model_dump(exclude_unset=True)
        address = await self.address_repo.update(address, **update_data)
        await self.session.commit()
        await self.session.refresh(address)
        return address

    async def set_default_address(self, address_id: int, user_id: int) -> Address:
        address = await self.address_repo.get_by_id_and_user_id(address_id, user_id)
        if not address:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

        if not address.is_default:
            await self.address_repo.unset_default_for_user(user_id)
            address = await self.address_repo.update(address, is_default=True)
            await self.session.commit()
            await self.session.refresh(address)

        return address

    async def delete_address(self, address_id: int, user_id: int) -> None:
        address = await self.address_repo.get_by_id_and_user_id(address_id, user_id)
        if not address:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

        was_default = address.is_default
        await self.address_repo.delete_address(address)
        
        # If we deleted the default address, make another one default
        if was_default:
            remaining = await self.address_repo.get_by_user_id(user_id)
            if remaining:
                await self.address_repo.update(remaining[0], is_default=True)
        
        await self.session.commit()
