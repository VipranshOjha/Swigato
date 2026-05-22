"""
app/core/constants.py
──────────────────────
All application-wide enumerations.

Why enums and not plain strings?
- Database stores the string value (human-readable, migratable)
- Application code uses the enum (type-safe, IDE-completable, refactorable)
- Invalid transitions or values are caught at Python level, not DB level
"""
from enum import StrEnum


# ─── User & RBAC ─────────────────────────────────────────────────────────────

class UserRole(StrEnum):
    CUSTOMER = "customer"
    RESTAURANT_OWNER = "restaurant_owner"
    DELIVERY_PARTNER = "delivery_partner"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


# ─── Restaurant ───────────────────────────────────────────────────────────────

class RestaurantApprovalStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


# ─── Order ────────────────────────────────────────────────────────────────────

class OrderStatus(StrEnum):
    """
    Complete order lifecycle.
    State machine enforced in order_service.py.
    """
    # Pre-payment
    PENDING = "pending"                        # Cart → checkout initiated
    PAYMENT_INITIATED = "payment_initiated"    # Payment gateway called
    PAYMENT_FAILED = "payment_failed"          # Gateway returned failure
    # Post-payment / COD
    PLACED = "placed"                          # Payment confirmed OR COD order placed
    # Restaurant side
    ACCEPTED = "accepted"                      # Restaurant confirmed
    REJECTED = "rejected"                      # Restaurant rejected
    PREPARING = "preparing"                    # Kitchen is preparing
    READY_FOR_PICKUP = "ready_for_pickup"      # Packaged, waiting for rider
    # Delivery side
    RIDER_ASSIGNED = "rider_assigned"          # Rider found and assigned
    PICKED_UP = "picked_up"                    # Rider collected from restaurant
    IN_TRANSIT = "in_transit"                  # En route to customer
    DELIVERED = "delivered"                    # Successfully delivered
    # Terminal failure states
    CANCELLED = "cancelled"                    # Cancelled before pickup
    REFUNDED = "refunded"                      # Money returned


# ─── Payment ──────────────────────────────────────────────────────────────────

class PaymentStatus(StrEnum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentGateway(StrEnum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"
    PAYPAL = "paypal"
    COD = "cod"  # Cash on Delivery — no external gateway


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


# ─── Delivery ────────────────────────────────────────────────────────────────

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


# ─── Coupon ───────────────────────────────────────────────────────────────────

class CouponType(StrEnum):
    PLATFORM = "platform"      # Applies to all restaurants
    RESTAURANT = "restaurant"  # Specific to one restaurant


class DiscountType(StrEnum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


# ─── Notification ────────────────────────────────────────────────────────────

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


# ─── Review ───────────────────────────────────────────────────────────────────

class ReviewEntityType(StrEnum):
    RESTAURANT = "restaurant"
    DELIVERY_PARTNER = "delivery_partner"
    MENU_ITEM = "menu_item"


# ─── Audit ────────────────────────────────────────────────────────────────────

class AuditAction(StrEnum):
    # Auth
    USER_REGISTERED = "USER_REGISTERED"
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    USER_PASSWORD_CHANGED = "USER_PASSWORD_CHANGED"
    USER_EMAIL_VERIFIED = "USER_EMAIL_VERIFIED"
    # Admin
    USER_SUSPENDED = "USER_SUSPENDED"
    USER_UNSUSPENDED = "USER_UNSUSPENDED"
    RESTAURANT_APPROVED = "RESTAURANT_APPROVED"
    RESTAURANT_REJECTED = "RESTAURANT_REJECTED"
    RESTAURANT_SUSPENDED = "RESTAURANT_SUSPENDED"
    ORDER_REFUNDED = "ORDER_REFUNDED"
    COUPON_CREATED = "COUPON_CREATED"
    COUPON_DELETED = "COUPON_DELETED"
    DELIVERY_PARTNER_APPROVED = "DELIVERY_PARTNER_APPROVED"


# ─── Cancellation ────────────────────────────────────────────────────────────

class CancelledBy(StrEnum):
    CUSTOMER = "customer"
    RESTAURANT = "restaurant"
    SYSTEM = "system"
    ADMIN = "admin"


# ─── Allowed state transitions (Order State Machine) ─────────────────────────

ORDER_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {
        OrderStatus.PAYMENT_INITIATED,
        OrderStatus.PLACED,       # COD bypasses payment
        OrderStatus.CANCELLED,
    },
    OrderStatus.PAYMENT_INITIATED: {
        OrderStatus.PLACED,
        OrderStatus.PAYMENT_FAILED,
        OrderStatus.CANCELLED,
    },
    OrderStatus.PAYMENT_FAILED: {
        OrderStatus.PAYMENT_INITIATED,  # Retry
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
    OrderStatus.DELIVERED: set(),       # Terminal
    OrderStatus.REJECTED: {
        OrderStatus.REFUNDED,
    },
    OrderStatus.CANCELLED: {
        OrderStatus.REFUNDED,
    },
    OrderStatus.REFUNDED: set(),        # Terminal
}
