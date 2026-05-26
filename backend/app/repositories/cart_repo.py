import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSession
from app.models.cart import Cart, CartItem
from app.models.menu import MenuItem


class CartRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_cart_by_user_id(self, user_id: int) -> Optional[Cart]:
        """Fetch the active cart for a user with items and menu details eager loaded."""
        stmt = (
            select(Cart)
            .where(Cart.user_id == user_id)
            .options(
                selectinload(Cart.restaurant),
                selectinload(Cart.items).selectinload(CartItem.menu_item)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_cart(self, user_id: int, restaurant_id: Optional[uuid.UUID] = None) -> Cart:
        """Create a new cart for a user."""
        cart = Cart(user_id=user_id, restaurant_id=restaurant_id)
        self.session.add(cart)
        await self.session.flush()
        return cart

    async def add_item_to_cart(self, cart_id: uuid.UUID, menu_item_id: uuid.UUID, quantity: int) -> CartItem:
        """Add a new item to the cart."""
        item = CartItem(cart_id=cart_id, menu_item_id=menu_item_id, quantity=quantity)
        self.session.add(item)
        await self.session.flush()
        return item
    
    async def update_item_quantity(self, cart_id: uuid.UUID, menu_item_id: uuid.UUID, quantity: int) -> Optional[CartItem]:
        """Update quantity of an existing item in the cart."""
        stmt = select(CartItem).where(
            CartItem.cart_id == cart_id,
            CartItem.menu_item_id == menu_item_id
        )
        result = await self.session.execute(stmt)
        item = result.scalar_one_or_none()
        
        if item:
            item.quantity = quantity
            await self.session.flush()
        
        return item
    
    async def remove_item_from_cart(self, cart_id: uuid.UUID, menu_item_id: uuid.UUID) -> bool:
        """Remove an item from the cart."""
        stmt = select(CartItem).where(
            CartItem.cart_id == cart_id,
            CartItem.menu_item_id == menu_item_id
        )
        result = await self.session.execute(stmt)
        item = result.scalar_one_or_none()
        
        if item:
            await self.session.delete(item)
            await self.session.flush()
            return True
        return False
        
    async def clear_cart(self, cart_id: uuid.UUID) -> None:
        """Remove all items and clear restaurant_id from the cart."""
        stmt = select(Cart).where(Cart.id == cart_id)
        result = await self.session.execute(stmt)
        cart = result.scalar_one_or_none()
        
        if cart:
            # Delete all items explicitly just in case cascade is tricky in asyncio,
            # though cascade="all, delete-orphan" on relationship usually handles it 
            # if we manipulate the relationship or delete the cart. 
            # We want to KEEP the cart, just clear items.
            for item in list(cart.items):
                await self.session.delete(item)
            
            cart.restaurant_id = None
            await self.session.flush()

    async def update_cart_restaurant(self, cart_id: uuid.UUID, restaurant_id: uuid.UUID) -> None:
        """Update the restaurant_id for the cart."""
        stmt = select(Cart).where(Cart.id == cart_id)
        result = await self.session.execute(stmt)
        cart = result.scalar_one_or_none()
        
        if cart:
            cart.restaurant_id = restaurant_id
            await self.session.flush()
