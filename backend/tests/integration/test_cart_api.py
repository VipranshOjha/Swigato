import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.cart import Cart, CartItem
from app.models.menu import MenuCategory, MenuItem
from app.models.restaurant import Restaurant

pytestmark = pytest.mark.asyncio

async def create_restaurant_with_menu(db, owner_id):
    import uuid
    # Create restaurant
    restaurant = Restaurant(
        owner_id=owner_id,
        name="Cart Test Rest",
        slug=f"cart-test-{uuid.uuid4()}",
        description="Desc",
        phone="1234567890",
        email="cartrest@example.com",
        address="123 Cart St",
        city="CartCity",
        state="CartState",
        country="India",
        postal_code="12345",
        latitude=12.3,
        longitude=45.6,
        is_open=True,
        approval_status="APPROVED",
        base_delivery_fee=40.0,
        free_delivery_above=200.0
    )
    db.add(restaurant)
    await db.commit()
    
    # Create category
    cat = MenuCategory(restaurant_id=restaurant.id, name="Mains")
    db.add(cat)
    await db.commit()
    
    # Create items
    item1 = MenuItem(restaurant_id=restaurant.id, category_id=cat.id, name="Item 1", price=100.0, is_veg=True, is_available=True)
    item2 = MenuItem(restaurant_id=restaurant.id, category_id=cat.id, name="Item 2", price=150.0, is_veg=False, is_available=True)
    item_unavailable = MenuItem(restaurant_id=restaurant.id, category_id=cat.id, name="Item 3", price=50.0, is_veg=True, is_available=False)
    
    db.add_all([item1, item2, item_unavailable])
    await db.commit()
    
    return restaurant, item1, item2, item_unavailable


@pytest.fixture
async def cart_setup(db_session, test_user):
    # test_user can act as the owner for these tests since we just need a user ID
    rest1, item1_r1, item2_r1, unavail_r1 = await create_restaurant_with_menu(db_session, test_user.id)
    rest2, item1_r2, _, _ = await create_restaurant_with_menu(db_session, test_user.id)
    
    return {
        "rest1": rest1,
        "rest2": rest2,
        "item1_r1": item1_r1,
        "item2_r1": item2_r1,
        "unavail_r1": unavail_r1,
        "item1_r2": item1_r2
    }


class TestCartAPI:
    async def test_get_empty_cart(self, client: AsyncClient, auth_headers: dict):
        response = await client.get("/api/v1/cart", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["subtotal"] == 0.0
        assert data["grand_total"] == 0.0

    async def test_add_item_to_cart(self, client: AsyncClient, auth_headers: dict, cart_setup):
        await client.delete("/api/v1/cart", headers=auth_headers)
        item = cart_setup["item1_r1"]
        response = await client.post(
            "/api/v1/cart/items",
            headers=auth_headers,
            json={"menu_item_id": str(item.id), "quantity": 1}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["menu_item_id"] == str(item.id)
        assert data["items"][0]["quantity"] == 1
        assert data["restaurant_id"] == str(cart_setup["rest1"].id)
        assert data["subtotal"] == 100.0
        assert data["delivery_fee"] == 40.0
        assert data["tax_amount"] == 5.0 # 5% of 100
        assert data["grand_total"] == 145.0

    async def test_add_unavailable_item(self, client: AsyncClient, auth_headers: dict, cart_setup):
        await client.delete("/api/v1/cart", headers=auth_headers)
        item = cart_setup["unavail_r1"]
        response = await client.post(
            "/api/v1/cart/items",
            headers=auth_headers,
            json={"menu_item_id": str(item.id), "quantity": 1}
        )
        assert response.status_code == 400
        assert "unavailable" in response.json()["detail"].lower()

    async def test_cross_restaurant_block(self, client: AsyncClient, auth_headers: dict, cart_setup):
        await client.delete("/api/v1/cart", headers=auth_headers)
        # Add item from rest1
        await client.post(
            "/api/v1/cart/items",
            headers=auth_headers,
            json={"menu_item_id": str(cart_setup["item1_r1"].id), "quantity": 1}
        )
        
        # Try to add item from rest2
        response = await client.post(
            "/api/v1/cart/items",
            headers=auth_headers,
            json={"menu_item_id": str(cart_setup["item1_r2"].id), "quantity": 1}
        )
        assert response.status_code == 400
        assert "another restaurant" in response.json()["detail"].lower()

    async def test_update_item_quantity(self, client: AsyncClient, auth_headers: dict, cart_setup):
        await client.delete("/api/v1/cart", headers=auth_headers)
        # Add item
        item = cart_setup["item1_r1"]
        await client.post(
            "/api/v1/cart/items",
            headers=auth_headers,
            json={"menu_item_id": str(item.id), "quantity": 1}
        )
        
        # Update quantity
        response = await client.patch(
            f"/api/v1/cart/items/{item.id}",
            headers=auth_headers,
            json={"quantity": 3}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items"][0]["quantity"] == 3
        assert data["subtotal"] == 300.0
        # Delivery fee should be 0 because subtotal >= 200 (free_delivery_above)
        assert data["delivery_fee"] == 0.0

    async def test_remove_item(self, client: AsyncClient, auth_headers: dict, cart_setup):
        await client.delete("/api/v1/cart", headers=auth_headers)
        item = cart_setup["item1_r1"]
        await client.post(
            "/api/v1/cart/items",
            headers=auth_headers,
            json={"menu_item_id": str(item.id), "quantity": 1}
        )
        
        # Remove item
        response = await client.delete(
            f"/api/v1/cart/items/{item.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 0
        assert data["restaurant_id"] is None
        assert data["subtotal"] == 0.0

    async def test_clear_cart(self, client: AsyncClient, auth_headers: dict, cart_setup):
        await client.delete("/api/v1/cart", headers=auth_headers)
        await client.post(
            "/api/v1/cart/items",
            headers=auth_headers,
            json={"menu_item_id": str(cart_setup["item1_r1"].id), "quantity": 1}
        )
        await client.post(
            "/api/v1/cart/items",
            headers=auth_headers,
            json={"menu_item_id": str(cart_setup["item2_r1"].id), "quantity": 1}
        )
        
        response = await client.delete("/api/v1/cart", headers=auth_headers)
        assert response.status_code == 204
        
        # Verify cart is empty
        response = await client.get("/api/v1/cart", headers=auth_headers)
        data = response.json()
        assert len(data["items"]) == 0
        assert data["restaurant_id"] is None
