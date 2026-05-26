from enum import StrEnum

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
