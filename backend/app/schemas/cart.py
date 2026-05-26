import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CartItemAdd(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int = Field(..., gt=0, le=20, description="Quantity must be between 1 and 20")


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0, le=20, description="Quantity must be between 1 and 20")


class CartItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID
    name: str
    price: float
    is_veg: bool
    image_url: Optional[str] = None
    quantity: int
    item_subtotal: float

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: uuid.UUID
    restaurant_id: Optional[uuid.UUID] = None
    restaurant_name: Optional[str] = None
    items: List[CartItemResponse] = []
    subtotal: float
    delivery_fee: float
    tax_amount: float
    grand_total: float

    model_config = ConfigDict(from_attributes=True)
