from enum import StrEnum

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
