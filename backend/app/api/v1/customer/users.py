from fastapi import APIRouter, Depends, status

from app.database import DbSession
from app.dependencies.auth import AuthUser
from app.models.user import User
from app.schemas.address import AddressCreate, AddressResponse, AddressUpdate
from app.schemas.user import UpdateProfileRequest, UserMeResponse
from app.services.address_service import AddressService
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=UserMeResponse, status_code=status.HTTP_200_OK)
async def get_my_profile(
    current_user: AuthUser,
    db: DbSession,
):
    user_service = UserService(db)
    user = await user_service.get_user_by_id(current_user.id)
    return UserMeResponse.from_user(user)


@router.patch("/me", response_model=UserMeResponse, status_code=status.HTTP_200_OK)
async def update_my_profile(
    profile_data: UpdateProfileRequest,
    current_user: AuthUser,
    db: DbSession,
):
    user_service = UserService(db)
    user = await user_service.update_profile(current_user.id, profile_data)
    return UserMeResponse.from_user(user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(
    current_user: AuthUser,
    db: DbSession,
):
    user_service = UserService(db)
    await user_service.soft_delete_user(current_user.id)


@router.get("/me/roles", response_model=list[str], status_code=status.HTTP_200_OK)
async def get_my_roles(
    current_user: AuthUser,
    db: DbSession,
):
    user_service = UserService(db)
    user = await user_service.get_user_by_id(current_user.id)
    return user.role_names


# Addresses

@router.get("/me/addresses", response_model=list[AddressResponse], status_code=status.HTTP_200_OK)
async def get_my_addresses(
    current_user: AuthUser,
    db: DbSession,
):
    address_service = AddressService(db)
    addresses = await address_service.get_user_addresses(current_user.id)
    return [AddressResponse.from_address(addr) for addr in addresses]


@router.post("/me/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    address_data: AddressCreate,
    current_user: AuthUser,
    db: DbSession,
):
    address_service = AddressService(db)
    address = await address_service.create_address(current_user.id, address_data)
    return AddressResponse.from_address(address)


@router.put("/me/addresses/{address_id}", response_model=AddressResponse, status_code=status.HTTP_200_OK)
async def update_address(
    address_id: int,
    address_data: AddressUpdate,
    current_user: AuthUser,
    db: DbSession,
):
    address_service = AddressService(db)
    address = await address_service.update_address(address_id, current_user.id, address_data)
    return AddressResponse.from_address(address)


@router.patch("/me/addresses/{address_id}/default", response_model=AddressResponse, status_code=status.HTTP_200_OK)
async def set_default_address(
    address_id: int,
    current_user: AuthUser,
    db: DbSession,
):
    address_service = AddressService(db)
    address = await address_service.set_default_address(address_id, current_user.id)
    return AddressResponse.from_address(address)


@router.delete("/me/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: int,
    current_user: AuthUser,
    db: DbSession,
):
    address_service = AddressService(db)
    await address_service.delete_address(address_id, current_user.id)
