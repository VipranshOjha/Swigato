"""
app/dependencies/owner.py
─────────────────────────
Owner-specific dependencies.
"""
from typing import Annotated

from fastapi import Depends

from app.constants import UserRole
from app.dependencies.auth import CurrentUser, require_roles

def get_current_owner(
    user: CurrentUser = Depends(require_roles(UserRole.RESTAURANT_OWNER))
) -> CurrentUser:
    return user

OwnerUser = Annotated[CurrentUser, Depends(get_current_owner)]
