import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_register_delivery_partner(client: AsyncClient, delivery_partner_token: str):
    headers = {"Authorization": f"Bearer {delivery_partner_token}"}
    response = await client.post(
        "/api/v1/delivery/profile",
        headers=headers,
        json={
            "phone": "+1234567890",
            "vehicle_type": "motorcycle",
            "vehicle_number": "MH-12-AB-1234"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["phone"] == "+1234567890"
    assert data["vehicle_type"] == "motorcycle"
    assert data["vehicle_number"] == "MH-12-AB-1234"
    assert data["is_verified"] is False
    assert data["is_online"] is False


async def test_get_my_profile(client: AsyncClient, delivery_partner_token: str):
    headers = {"Authorization": f"Bearer {delivery_partner_token}"}
    # First register
    await client.post(
        "/api/v1/delivery/profile",
        headers=headers,
        json={
            "phone": "+1234567890",
            "vehicle_type": "motorcycle",
            "vehicle_number": "MH-12-AB-1234"
        }
    )
    
    # Then get
    response = await client.get("/api/v1/delivery/profile/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["phone"] == "+1234567890"


async def test_update_location(client: AsyncClient, delivery_partner_token: str):
    headers = {"Authorization": f"Bearer {delivery_partner_token}"}
    await client.post(
        "/api/v1/delivery/profile",
        headers=headers,
        json={
            "phone": "+1234567890",
            "vehicle_type": "motorcycle",
            "vehicle_number": "MH-12-AB-1234"
        }
    )
    
    response = await client.post(
        "/api/v1/delivery/profile/me/location",
        headers=headers,
        json={
            "latitude": 18.5204,
            "longitude": 73.8567
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["current_latitude"] == 18.5204
    assert data["current_longitude"] == 73.8567


async def test_admin_list_and_verify(client: AsyncClient, admin_token: str, delivery_partner_token: str):
    delivery_headers = {"Authorization": f"Bearer {delivery_partner_token}"}
    # Register partner first
    reg_response = await client.post(
        "/api/v1/delivery/profile",
        headers=delivery_headers,
        json={
            "phone": "+1234567890",
            "vehicle_type": "motorcycle",
            "vehicle_number": "MH-12-AB-1234"
        }
    )
    assert reg_response.status_code == 201
    profile_id = reg_response.json()["id"]

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # List all partners
    list_response = await client.get("/api/v1/admin/delivery-partners", headers=admin_headers)
    assert list_response.status_code == 200
    assert list_response.json()["total"] >= 1
    
    # Verify partner
    verify_response = await client.patch(
        f"/api/v1/admin/delivery-partners/{profile_id}/verify?verify=true",
        headers=admin_headers
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["is_verified"] is True
