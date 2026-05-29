"""
app/api/v1/router.py
─────────────────────
Central v1 API router. All sub-routers are included here.
"""
from fastapi import APIRouter

from app.api.v1.auth import login, register, password
from app.api.v1.customer import users, restaurants, menus, cart, orders as customer_orders
from app.api.v1.owner import restaurants as owner_restaurants, menus as owner_menus, orders as owner_orders, reviews as owner_reviews
from app.api.v1.admin import restaurants as admin_restaurants, orders as admin_orders, payments as admin_payments, delivery_partners as admin_delivery_partners, reviews as admin_reviews
from app.api.v1.payments import routes as payments
from app.api.v1.delivery import profile as delivery_profile, orders as delivery_orders
from app.api.v1.endpoints import reviews as customer_reviews

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
api_router.include_router(customer_reviews.router, prefix="/reviews", tags=["reviews"])

# Owner
api_router.include_router(owner_restaurants.router, prefix="/owner/restaurants")
api_router.include_router(owner_menus.router)
api_router.include_router(owner_orders.router, prefix="/owner")
api_router.include_router(owner_reviews.router, prefix="/owner/reviews", tags=["owner-reviews"])

# Admin
api_router.include_router(admin_restaurants.router, prefix="/admin/restaurants")
api_router.include_router(admin_orders.router, prefix="/admin")
api_router.include_router(admin_payments.router, prefix="/admin")
api_router.include_router(admin_delivery_partners.router, prefix="/admin")
api_router.include_router(admin_reviews.router, prefix="/admin/reviews", tags=["admin-reviews"])

# Payments
api_router.include_router(payments.router)

# Delivery
api_router.include_router(delivery_profile.router, prefix="/delivery")
api_router.include_router(delivery_orders.router, prefix="/delivery")
