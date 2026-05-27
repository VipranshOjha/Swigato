"""
app/api/v1/delivery/profile.py
──────────────────────────────
Endpoints for delivery partners to manage their profile and status.
"""
from fastapi import APIRouter, Depends, status

from app.database import DbSession
from app.dependencies.delivery import DeliveryUser
from app.schemas.delivery import (
    DeliveryPartnerProfileResponse,
    DeliveryPartnerRegister,
    DeliveryPartnerUpdate,
    LocationUpdate,
    OnlineStatusUpdate,
)
from app.services.delivery_service import DeliveryService

router = APIRouter(prefix="/profile", tags=["Delivery Partner Profile"])


@router.post(
    "",
    response_model=DeliveryPartnerProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register as a delivery partner",
)
async def register_profile(
    payload: DeliveryPartnerRegister,
    current_user: DeliveryUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.register_partner(current_user.id, payload)


@router.get(
    "/me",
    response_model=DeliveryPartnerProfileResponse,
    summary="Get my delivery profile",
)
async def get_my_profile(
    current_user: DeliveryUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.get_my_profile(current_user.id)


@router.patch(
    "/me",
    response_model=DeliveryPartnerProfileResponse,
    summary="Update my delivery profile",
)
async def update_profile(
    payload: DeliveryPartnerUpdate,
    current_user: DeliveryUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.update_profile(current_user.id, payload)


@router.patch(
    "/me/online",
    response_model=DeliveryPartnerProfileResponse,
    summary="Toggle online status (start/stop shift)",
)
async def toggle_online(
    payload: OnlineStatusUpdate,
    current_user: DeliveryUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.set_online_status(current_user.id, payload.is_online)



@router.post(
    "/me/location",
    response_model=DeliveryPartnerProfileResponse,
    summary="Update current GPS location",
)
async def update_location(
    payload: LocationUpdate,
    current_user: DeliveryUser,
    db: DbSession,
):
    service = DeliveryService(db)
    return await service.update_location(current_user.id, payload)
