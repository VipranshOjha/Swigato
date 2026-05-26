"""
app/api/v1/router.py
─────────────────────
Central v1 API router. All sub-routers are included here.
"""
from fastapi import APIRouter

from app.api.v1.auth import login, register, password
from app.api.v1.customer import users, restaurants, menus, cart, orders as customer_orders
from app.api.v1.owner import restaurants as owner_restaurants, menus as owner_menus, orders as owner_orders
from app.api.v1.admin import restaurants as admin_restaurants, orders as admin_orders, payments as admin_payments
from app.api.v1.payments import routes as payments

api_router = APIRouter(prefix="/api/v1")

# Auth
api_router.include_router(login.router)
api_router.include_router(register.router)
api_router.include_router(password.router)

# Customer / Public
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(restaurants.router, prefix="/restaurants", tags=["restaurants"])
api_router.include_router(menus.router)
api_router.include_router(cart.router)
api_router.include_router(customer_orders.router)

# Owner
api_router.include_router(owner_restaurants.router, prefix="/owner/restaurants")
api_router.include_router(owner_menus.router)
api_router.include_router(owner_orders.router, prefix="/owner")

# Admin
api_router.include_router(admin_restaurants.router, prefix="/admin/restaurants")
api_router.include_router(admin_orders.router, prefix="/admin")
api_router.include_router(admin_payments.router, prefix="/admin")

# Payments
api_router.include_router(payments.router)
