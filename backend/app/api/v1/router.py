"""
app/api/v1/router.py
─────────────────────
Central v1 API router. All sub-routers are included here.
Add new phase routers here as they're implemented.
"""
from fastapi import APIRouter

from app.api.v1 import auth
from app.api.v1 import users

api_router = APIRouter(prefix="/api/v1")

# Phase 1
api_router.include_router(auth.router)

# Phase 2 — Users
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Phase 3 — Restaurants
# from app.api.v1 import restaurants
# api_router.include_router(restaurants.router)

# Phase 4 — Menus
# from app.api.v1 import menus
# api_router.include_router(menus.router)

# Phase 5 — Cart
# from app.api.v1 import cart
# api_router.include_router(cart.router)

# Phase 6 — Orders
# from app.api.v1 import orders
# api_router.include_router(orders.router)

# Phase 7 — Payments
# from app.api.v1 import payments
# api_router.include_router(payments.router)

# Phase 8 — Delivery
# from app.api.v1 import delivery
# api_router.include_router(delivery.router)

# Phase 9 — Reviews, Notifications, Coupons
# from app.api.v1 import reviews, notifications, coupons
# api_router.include_router(reviews.router)
# api_router.include_router(notifications.router)
# api_router.include_router(coupons.router)

# Phase 10 — Search, Admin
# from app.api.v1 import search, admin
# api_router.include_router(search.router)
# api_router.include_router(admin.router)
