from enum import StrEnum

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
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.CANCELLED,
    },
    OrderStatus.PICKED_UP: {
        OrderStatus.IN_TRANSIT,
        OrderStatus.CANCELLED,
    },
    OrderStatus.IN_TRANSIT: {
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
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
