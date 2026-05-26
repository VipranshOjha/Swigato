from enum import StrEnum

class UserRole(StrEnum):
    CUSTOMER = "customer"
    RESTAURANT_OWNER = "restaurant_owner"
    DELIVERY_PARTNER = "delivery_partner"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
