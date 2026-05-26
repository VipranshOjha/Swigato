from enum import StrEnum

class CouponType(StrEnum):
    PLATFORM = "platform"
    RESTAURANT = "restaurant"

class DiscountType(StrEnum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"
