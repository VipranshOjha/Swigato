"""
app/dependencies/admin.py
─────────────────────────
Admin-specific dependencies.
"""
from typing import Annotated

from fastapi import Depends

from app.constants import UserRole
from app.dependencies.auth import CurrentUser, require_roles

def get_current_admin(
    user: CurrentUser = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))
) -> CurrentUser:
    return user

AdminUser = Annotated[CurrentUser, Depends(get_current_admin)]
