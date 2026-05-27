"""
app/dependencies/delivery.py
────────────────────────────
Delivery partner specific dependencies.
"""
from typing import Annotated

from fastapi import Depends

from app.constants import UserRole
from app.dependencies.auth import CurrentUser, require_roles

def get_current_delivery_partner(
    user: CurrentUser = Depends(require_roles(UserRole.DELIVERY_PARTNER))
) -> CurrentUser:
    return user

DeliveryUser = Annotated[CurrentUser, Depends(get_current_delivery_partner)]
