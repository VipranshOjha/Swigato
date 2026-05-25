import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.restaurant import ApprovalStatus


@pytest.mark.asyncio
async def test_create_restaurant(
    client: AsyncClient,
    restaurant_owner_token: str,
    db_session: AsyncSession
):
    headers = {"Authorization": f"Bearer {restaurant_owner_token}"}
    payload = {
        "name": "Test Restaurant",
        "phone": "1234567890",
        "email": "test@restaurant.com",
        "address": "123 Main St",
        "city": "Test City",
        "state": "Test State",
        "postal_code": "12345",
        "delivery_radius_km": 5.0,
        "minimum_order_amount": 100.0,
        "base_delivery_fee": 20.0,
    }
    
    response = await client.post("/api/v1/owner/restaurants/", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Restaurant"
    assert data["slug"] == "test-restaurant"
    assert data["approval_status"] == ApprovalStatus.DRAFT.value
    
    # Test Submit
    res_id = data["id"]
    submit_response = await client.post(f"/api/v1/owner/restaurants/{res_id}/submit", headers=headers)
    assert submit_response.status_code == 200
    assert submit_response.json()["approval_status"] == ApprovalStatus.PENDING_APPROVAL.value


@pytest.mark.asyncio
async def test_admin_approve_restaurant(
    client: AsyncClient,
    restaurant_owner_token: str,
    admin_token: str,
    db_session: AsyncSession
):
    owner_headers = {"Authorization": f"Bearer {restaurant_owner_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create
    payload = {
        "name": "Admin Test Restaurant",
        "phone": "0987654321",
        "email": "admin@restaurant.com",
        "address": "456 Admin St",
        "city": "Admin City",
        "state": "Admin State",
        "postal_code": "54321",
    }
    resp = await client.post("/api/v1/owner/restaurants/", json=payload, headers=owner_headers)
    res_id = resp.json()["id"]
    
    # Submit
    await client.post(f"/api/v1/owner/restaurants/{res_id}/submit", headers=owner_headers)
    
    # Admin Approve
    approve_resp = await client.patch(f"/api/v1/admin/restaurants/{res_id}/approve", headers=admin_headers)
    assert approve_resp.status_code == 200
    assert approve_resp.json()["approval_status"] == ApprovalStatus.APPROVED.value
    assert approve_resp.json()["verified_by"] is not None

    # Public Search
    public_resp = await client.get("/api/v1/restaurants/?city=Admin City")
    assert public_resp.status_code == 200
    assert len(public_resp.json()["items"]) == 1
    assert public_resp.json()["items"][0]["name"] == "Admin Test Restaurant"
