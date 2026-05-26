import os

dest_dir = r'C:\Users\ojhav\OneDrive\Desktop\Swigato\backend\app\constants'

roles_code = """from enum import StrEnum

class UserRole(StrEnum):
    CUSTOMER = "customer"
    RESTAURANT_OWNER = "restaurant_owner"
    DELIVERY_PARTNER = "delivery_partner"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
"""

orders_code = """from enum import StrEnum

class OrderStatus(StrEnum):
    PENDING = "pending"
    AWAITING_PAYMENT = "awaiting_payment"
    PAYMENT_FAILED = "payment_failed"
    PLACED = "placed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    RIDER_ASSIGNED = "rider_assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

PRE_PAYMENT_STATUSES = [
    OrderStatus.PENDING,
    OrderStatus.AWAITING_PAYMENT,
    OrderStatus.PAYMENT_FAILED,
]

class CancelledBy(StrEnum):
    CUSTOMER = "customer"
    RESTAURANT = "restaurant"
    SYSTEM = "system"
    ADMIN = "admin"

ORDER_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {
        OrderStatus.AWAITING_PAYMENT,
        OrderStatus.PLACED,
        OrderStatus.CANCELLED,
    },
    OrderStatus.AWAITING_PAYMENT: {
        OrderStatus.PLACED,
        OrderStatus.PAYMENT_FAILED,
        OrderStatus.CANCELLED,
    },
    OrderStatus.PAYMENT_FAILED: {
        OrderStatus.AWAITING_PAYMENT,
        OrderStatus.CANCELLED,
    },
    OrderStatus.PLACED: {
        OrderStatus.ACCEPTED,
        OrderStatus.REJECTED,
        OrderStatus.CANCELLED,
    },
    OrderStatus.ACCEPTED: {
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
    },
    OrderStatus.PREPARING: {
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.CANCELLED,
    },
    OrderStatus.READY_FOR_PICKUP: {
        OrderStatus.RIDER_ASSIGNED,
    },
    OrderStatus.RIDER_ASSIGNED: {
        OrderStatus.PICKED_UP,
    },
    OrderStatus.PICKED_UP: {
        OrderStatus.IN_TRANSIT,
    },
    OrderStatus.IN_TRANSIT: {
        OrderStatus.DELIVERED,
    },
    OrderStatus.DELIVERED: set(),
    OrderStatus.REJECTED: {
        OrderStatus.REFUNDED,
    },
    OrderStatus.CANCELLED: {
        OrderStatus.REFUNDED,
    },
    OrderStatus.REFUNDED: set(),
}
"""

payments_code = """from enum import StrEnum

class PaymentStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"

class PaymentGateway(StrEnum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"
    PAYPAL = "paypal"
    COD = "cod"

class PaymentMethod(StrEnum):
    CARD = "card"
    UPI = "upi"
    WALLET = "wallet"
    NET_BANKING = "net_banking"
    COD = "cod"

class RefundStatus(StrEnum):
    NONE = "none"
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
"""

restaurants_code = """from enum import StrEnum

class RestaurantApprovalStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"
"""

delivery_code = """from enum import StrEnum

class VehicleType(StrEnum):
    BICYCLE = "bicycle"
    MOTORCYCLE = "motorcycle"
    CAR = "car"
    ELECTRIC_SCOOTER = "electric_scooter"

class BackgroundCheckStatus(StrEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    APPROVED = "approved"
    REJECTED = "rejected"

class DeliveryAssignmentStatus(StrEnum):
    ASSIGNED = "assigned"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    PICKED_UP = "picked_up"
    DELIVERED = "delivered"
"""

promotions_code = """from enum import StrEnum

class CouponType(StrEnum):
    PLATFORM = "platform"
    RESTAURANT = "restaurant"

class DiscountType(StrEnum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"
"""

notifications_code = """from enum import StrEnum

class NotificationType(StrEnum):
    ORDER_UPDATE = "order_update"
    PROMOTION = "promotion"
    SYSTEM = "system"
    PAYMENT = "payment"
    DELIVERY = "delivery"

class NotificationChannel(StrEnum):
    IN_APP = "in_app"
    PUSH = "push"
    EMAIL = "email"
    SMS = "sms"
"""

reviews_code = """from enum import StrEnum

class ReviewEntityType(StrEnum):
    RESTAURANT = "restaurant"
    DELIVERY_PARTNER = "delivery_partner"
    MENU_ITEM = "menu_item"
"""

audit_code = """from enum import StrEnum

class AuditAction(StrEnum):
    USER_REGISTERED = "USER_REGISTERED"
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    USER_PASSWORD_CHANGED = "USER_PASSWORD_CHANGED"
    USER_EMAIL_VERIFIED = "USER_EMAIL_VERIFIED"
    USER_SUSPENDED = "USER_SUSPENDED"
    USER_UNSUSPENDED = "USER_UNSUSPENDED"
    RESTAURANT_APPROVED = "RESTAURANT_APPROVED"
    RESTAURANT_REJECTED = "RESTAURANT_REJECTED"
    RESTAURANT_SUSPENDED = "RESTAURANT_SUSPENDED"
    ORDER_REFUNDED = "ORDER_REFUNDED"
    COUPON_CREATED = "COUPON_CREATED"
    COUPON_DELETED = "COUPON_DELETED"
    DELIVERY_PARTNER_APPROVED = "DELIVERY_PARTNER_APPROVED"
"""

init_code = """from .roles import UserRole
from .orders import OrderStatus, PRE_PAYMENT_STATUSES, CancelledBy, ORDER_TRANSITIONS
from .payments import PaymentStatus, PaymentGateway, PaymentMethod, RefundStatus
from .restaurants import RestaurantApprovalStatus
from .delivery import VehicleType, BackgroundCheckStatus, DeliveryAssignmentStatus
from .promotions import CouponType, DiscountType
from .notifications import NotificationType, NotificationChannel
from .reviews import ReviewEntityType
from .audit import AuditAction

__all__ = [
    "UserRole",
    "OrderStatus", "PRE_PAYMENT_STATUSES", "CancelledBy", "ORDER_TRANSITIONS",
    "PaymentStatus", "PaymentGateway", "PaymentMethod", "RefundStatus",
    "RestaurantApprovalStatus",
    "VehicleType", "BackgroundCheckStatus", "DeliveryAssignmentStatus",
    "CouponType", "DiscountType",
    "NotificationType", "NotificationChannel",
    "ReviewEntityType",
    "AuditAction"
]
"""

files = {
    'roles.py': roles_code,
    'orders.py': orders_code,
    'payments.py': payments_code,
    'restaurants.py': restaurants_code,
    'delivery.py': delivery_code,
    'promotions.py': promotions_code,
    'notifications.py': notifications_code,
    'reviews.py': reviews_code,
    'audit.py': audit_code,
    '__init__.py': init_code
}

for name, content in files.items():
    with open(os.path.join(dest_dir, name), 'w', encoding='utf-8') as f:
        f.write(content)

print("Constants generated.")
