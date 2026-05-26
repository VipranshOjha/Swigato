import uuid
from typing import Optional

from fastapi import HTTPException, status

from app.database import AsyncSession
from app.models.cart import Cart, CartItem
from app.models.menu import MenuItem
from app.repositories.cart_repo import CartRepository
from app.schemas.cart import CartItemAdd, CartItemResponse, CartResponse
from sqlalchemy import select


class CartService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = CartRepository(session)

    async def get_or_create_cart(self, user_id: int) -> Cart:
        """Fetch the user's cart, creating one if it doesn't exist."""
        cart = await self.repo.get_cart_by_user_id(user_id)
        if not cart:
            await self.repo.create_cart(user_id)
            cart = await self.repo.get_cart_by_user_id(user_id)
        return cart

    def _build_cart_response(self, cart: Cart) -> CartResponse:
        """Calculate totals and build the response schema."""
        subtotal = 0.0
        items_resp = []

        for item in cart.items:
            # item.menu_item should be eager loaded
            price = float(item.menu_item.price)
            item_sub = price * item.quantity
            subtotal += item_sub

            items_resp.append(
                CartItemResponse(
                    id=item.id,
                    menu_item_id=item.menu_item_id,
                    name=item.menu_item.name,
                    price=price,
                    is_veg=item.menu_item.is_veg,
                    image_url=item.menu_item.image_url,
                    quantity=item.quantity,
                    item_subtotal=item_sub
                )
            )

        # Standard fees
        delivery_fee = 0.0
        if cart.restaurant and cart.restaurant.base_delivery_fee:
            delivery_fee = float(cart.restaurant.base_delivery_fee)
            # Free delivery above logic
            if cart.restaurant.free_delivery_above and subtotal >= cart.restaurant.free_delivery_above:
                delivery_fee = 0.0
        elif cart.restaurant:
            delivery_fee = 50.0  # fallback default if not set

        if subtotal == 0:
            delivery_fee = 0.0

        tax_amount = round(subtotal * 0.05, 2)  # 5% GST
        grand_total = subtotal + delivery_fee + tax_amount

        return CartResponse(
            id=cart.id,
            restaurant_id=cart.restaurant_id,
            restaurant_name=cart.restaurant.name if cart.restaurant else None,
            items=items_resp,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            tax_amount=tax_amount,
            grand_total=grand_total
        )

    async def get_cart(self, user_id: int) -> CartResponse:
        cart = await self.get_or_create_cart(user_id)
        return self._build_cart_response(cart)

    async def add_item(self, user_id: int, payload: CartItemAdd) -> CartResponse:
        # Fetch the menu item to validate
        stmt = select(MenuItem).where(MenuItem.id == payload.menu_item_id)
        result = await self.session.execute(stmt)
        menu_item = result.scalar_one_or_none()

        if not menu_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found.")
        if not menu_item.is_available:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Menu item is currently unavailable.")
        if menu_item.deleted_at is not None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found.")

        # Ensure restaurant is open / valid
        # We assume menu_item.restaurant is available or we can query it
        # Actually menu_item is linked to MenuCategory which is linked to Restaurant
        # We need the restaurant ID. Wait, menu_item doesn't have restaurant_id directly.
        # It has category_id. We must fetch the category.
        
        # Let's fetch category for restaurant ID
        await self.session.refresh(menu_item, ['category'])
        restaurant_id = menu_item.category.restaurant_id

        cart = await self.get_or_create_cart(user_id)

        # Cross-restaurant check
        if cart.restaurant_id and cart.restaurant_id != restaurant_id:
            if len(cart.items) > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Your cart contains items from another restaurant. Please clear it first."
                )
            else:
                # Update cart's restaurant_id if it's empty but bound to another
                await self.repo.update_cart_restaurant(cart.id, restaurant_id)
        elif not cart.restaurant_id:
            await self.repo.update_cart_restaurant(cart.id, restaurant_id)

        # Check if item already in cart
        existing_item = next((i for i in cart.items if i.menu_item_id == payload.menu_item_id), None)
        if existing_item:
            new_qty = existing_item.quantity + payload.quantity
            if new_qty > 20:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum quantity of 20 reached for this item.")
            await self.repo.update_item_quantity(cart.id, payload.menu_item_id, new_qty)
        else:
            await self.repo.add_item_to_cart(cart.id, payload.menu_item_id, payload.quantity)

        await self.session.commit()
        
        self.session.expire_all()
        # Re-fetch cart for updated response
        cart = await self.repo.get_cart_by_user_id(user_id)
        return self._build_cart_response(cart)

    async def update_quantity(self, user_id: int, menu_item_id: uuid.UUID, quantity: int) -> CartResponse:
        cart = await self.get_or_create_cart(user_id)
        
        existing_item = next((i for i in cart.items if i.menu_item_id == menu_item_id), None)
        if not existing_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart.")
            
        await self.repo.update_item_quantity(cart.id, menu_item_id, quantity)
        await self.session.commit()
        
        self.session.expire_all()
        cart = await self.repo.get_cart_by_user_id(user_id)
        return self._build_cart_response(cart)
        
    async def remove_item(self, user_id: int, menu_item_id: uuid.UUID) -> CartResponse:
        cart = await self.get_or_create_cart(user_id)
        
        removed = await self.repo.remove_item_from_cart(cart.id, menu_item_id)
        if not removed:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not in cart.")
            
        # If cart is now empty, clear restaurant_id
        self.session.expire_all()
        cart = await self.repo.get_cart_by_user_id(user_id) # reload
        if len(cart.items) == 0:
            await self.repo.update_cart_restaurant(cart.id, None)
            await self.session.commit()
            self.session.expire_all()
            cart = await self.repo.get_cart_by_user_id(user_id)
            
        return self._build_cart_response(cart)

    async def clear_cart(self, user_id: int) -> None:
        cart = await self.get_or_create_cart(user_id)
        await self.repo.clear_cart(cart.id)
        await self.session.commit()
