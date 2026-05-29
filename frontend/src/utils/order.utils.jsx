import React from 'react';
import { Package, ChefHat, CheckCircle2, Truck, Bike, ShoppingBag, MapPin, CheckCircle, XCircle } from 'lucide-react';

export const ORDER_STATUS = {
    PLACED: 'placed',
    ACCEPTED: 'accepted',
    PREPARING: 'preparing',
    READY_FOR_PICKUP: 'ready_for_pickup',
    RIDER_ASSIGNED: 'rider_assigned',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected'
};

// Derived status groups for polling logic and UI filtering
export const ACTIVE_ORDER_STATUSES = [
    ORDER_STATUS.PLACED,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY_FOR_PICKUP,
    ORDER_STATUS.RIDER_ASSIGNED,
    ORDER_STATUS.PICKED_UP,
    ORDER_STATUS.IN_TRANSIT,
];

export const FINAL_ORDER_STATUSES = [
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REJECTED,
];

export const OWNER_ACTIONABLE_STATUSES = [
    ORDER_STATUS.PLACED,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY_FOR_PICKUP,
];

export const isOrderActive = (status) => ACTIVE_ORDER_STATUSES.includes(status);
export const isOrderFinal = (status) => FINAL_ORDER_STATUSES.includes(status);

export const getOrderStatusConfig = (status) => {
    switch (status) {
        case ORDER_STATUS.PLACED:
            return {
                label: 'Order Placed',
                color: 'text-secondary',
                bgColor: 'bg-secondary-container',
                icon: <ShoppingBag className="w-4 h-4" />
            };
        case ORDER_STATUS.ACCEPTED:
            return {
                label: 'Accepted',
                color: 'text-primary',
                bgColor: 'bg-primary-container',
                icon: <CheckCircle2 className="w-4 h-4" />
            };
        case ORDER_STATUS.PREPARING:
            return {
                label: 'Preparing',
                color: 'text-status-warning',
                bgColor: 'bg-status-warning/10',
                icon: <ChefHat className="w-4 h-4" />
            };
        case ORDER_STATUS.READY_FOR_PICKUP:
            return {
                label: 'Ready for Pickup',
                color: 'text-tertiary',
                bgColor: 'bg-tertiary-container',
                icon: <Package className="w-4 h-4" />
            };
        case ORDER_STATUS.RIDER_ASSIGNED:
            return {
                label: 'Rider Assigned',
                color: 'text-primary',
                bgColor: 'bg-primary-container',
                icon: <Bike className="w-4 h-4" />
            };
        case ORDER_STATUS.PICKED_UP:
        case ORDER_STATUS.IN_TRANSIT:
            return {
                label: 'On the Way',
                color: 'text-primary',
                bgColor: 'bg-primary-container',
                icon: <Truck className="w-4 h-4" />
            };
        case ORDER_STATUS.DELIVERED:
            return {
                label: 'Delivered',
                color: 'text-status-success',
                bgColor: 'bg-status-success/10',
                icon: <CheckCircle className="w-4 h-4" />
            };
        case ORDER_STATUS.CANCELLED:
            return {
                label: 'Cancelled',
                color: 'text-error',
                bgColor: 'bg-error-container',
                icon: <XCircle className="w-4 h-4" />
            };
        case ORDER_STATUS.REJECTED:
            return {
                label: 'Rejected',
                color: 'text-error',
                bgColor: 'bg-error-container',
                icon: <XCircle className="w-4 h-4" />
            };
        default:
            return {
                label: status?.replace(/_/g, ' ') || 'Unknown',
                color: 'text-on-surface-variant',
                bgColor: 'bg-surface-container',
                icon: null
            };
    }
};
