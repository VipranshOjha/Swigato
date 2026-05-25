import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.restaurant import Restaurant, ApprovalStatus
from app.core.constants import UserRole
from app.services.auth_service import AuthService
from app.repositories.user_repo import UserRepository
from app.core.permissions import require_roles, CurrentUser
from app.core.exceptions import PermissionDeniedError
import uuid

@pytest.mark.asyncio
async def test_rbac_customer_only_denied():
    user = CurrentUser({"sub": "1", "roles": ["customer"]})
    checker = require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    with pytest.raises(PermissionDeniedError):
        await checker(user)

@pytest.mark.asyncio
async def test_rbac_admin_allowed():
    user = CurrentUser({"sub": "1", "roles": ["admin"]})
    checker = require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    result = await checker(user)
    assert result == user

@pytest.mark.asyncio
async def test_rbac_super_admin_allowed():
    user = CurrentUser({"sub": "1", "roles": ["super_admin"]})
    checker = require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    result = await checker(user)
    assert result == user

@pytest.mark.asyncio
async def test_rbac_customer_and_admin_allowed():
    user = CurrentUser({"sub": "1", "roles": ["customer", "admin"]})
    checker = require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
    result = await checker(user)
    assert result == user




