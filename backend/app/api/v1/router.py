"""
app/api/v1/router.py
─────────────────────
Central v1 API router. All sub-routers are included here.
Add new phase routers here as they're implemented.
"""
from fastapi import APIRouter

from app.api.v1 import (
    admin_restaurants,
    auth,
    owner_restaurants,
    owner_menus,
    restaurants,
    public_menus,
    users,
    cart,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(restaurants.router, prefix="/restaurants", tags=["restaurants"])
api_router.include_router(public_menus.router)
api_router.include_router(owner_restaurants.router, prefix="/owner/restaurants", tags=["owner_restaurants"])
api_router.include_router(owner_menus.router)
api_router.include_router(admin_restaurants.router, prefix="/admin/restaurants", tags=["admin_restaurants"])
api_router.include_router(cart.router)
