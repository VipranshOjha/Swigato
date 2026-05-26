"""
app/dependencies/customer.py
────────────────────────────
Customer-specific dependencies.
"""
from typing import Annotated

from fastapi import Depends

from app.constants import UserRole
from app.dependencies.auth import CurrentUser, require_roles

def get_current_customer(
    user: CurrentUser = Depends(require_roles(UserRole.CUSTOMER))
) -> CurrentUser:
    return user

CustomerUser = Annotated[CurrentUser, Depends(get_current_customer)]
