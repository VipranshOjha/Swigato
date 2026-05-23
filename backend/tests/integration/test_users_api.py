import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

pytestmark = pytest.mark.asyncio

async def test_get_my_profile(client: AsyncClient, test_user: User, auth_headers: dict):
    response = await client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["first_name"] == test_user.first_name

async def test_update_profile(client: AsyncClient, test_user: User, auth_headers: dict, db_session: AsyncSession):
    update_data = {
        "first_name": "UpdatedName",
        "email": "newemail@example.com"
    }
    response = await client.patch("/api/v1/users/me", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "UpdatedName"
    assert data["email"] == "newemail@example.com"
    assert data["is_email_verified"] is False  # Should be invalidated because email changed

async def test_get_roles(client: AsyncClient, auth_headers: dict):
    response = await client.get("/api/v1/users/me/roles", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

async def test_create_and_get_address(client: AsyncClient, auth_headers: dict):
    address_data = {
        "label": "Home",
        "address_line1": "123 Main St",
        "city": "TestCity",
        "state": "TestState",
        "country": "TestCountry",
        "postal_code": "12345",
        "latitude": 12.345678,
        "longitude": 98.765432,
        "is_default": True
    }
    # Create Address
    response = await client.post("/api/v1/users/me/addresses", json=address_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["label"] == "Home"
    assert data["city"] == "TestCity"
    assert data["is_default"] is True
    address_id = data["id"]

    # Get Addresses
    response2 = await client.get("/api/v1/users/me/addresses", headers=auth_headers)
    assert response2.status_code == 200
    addresses = response2.json()
    assert len(addresses) >= 1
    assert any(a["id"] == address_id for a in addresses)

async def test_update_and_delete_address(client: AsyncClient, auth_headers: dict):
    address_data = {
        "address_line1": "123 Delete St",
        "city": "DeleteCity",
        "state": "DeleteState",
        "country": "DeleteCountry",
        "postal_code": "00000"
    }
    create_response = await client.post("/api/v1/users/me/addresses", json=address_data, headers=auth_headers)
    assert create_response.status_code == 201
    address_id = create_response.json()["id"]

    # Update
    update_response = await client.put(f"/api/v1/users/me/addresses/{address_id}", json={"label": "Work"}, headers=auth_headers)
    assert update_response.status_code == 200
    assert update_response.json()["label"] == "Work"

    # Set Default
    default_response = await client.patch(f"/api/v1/users/me/addresses/{address_id}/default", headers=auth_headers)
    assert default_response.status_code == 200
    assert default_response.json()["is_default"] is True

    # Delete
    delete_response = await client.delete(f"/api/v1/users/me/addresses/{address_id}", headers=auth_headers)
    assert delete_response.status_code == 204

    # Verify Deletion
    get_response = await client.get("/api/v1/users/me/addresses", headers=auth_headers)
    assert not any(a["id"] == address_id for a in get_response.json())
