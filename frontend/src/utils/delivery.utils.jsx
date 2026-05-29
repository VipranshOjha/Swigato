import React from 'react';
import { Package, ChefHat, CheckCircle2, Truck, Bike, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { ORDER_STATUS } from './order.utils';

export const DELIVERY_ACTIVE_STATUSES = [
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY_FOR_PICKUP,
    ORDER_STATUS.RIDER_ASSIGNED,
    ORDER_STATUS.PICKED_UP,
    ORDER_STATUS.IN_TRANSIT,
];

export const DELIVERY_FINAL_STATUSES = [
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REJECTED,
];

export const isDeliveryActive = (status) => DELIVERY_ACTIVE_STATUSES.includes(status);
export const isDeliveryFinal = (status) => DELIVERY_FINAL_STATUSES.includes(status);
