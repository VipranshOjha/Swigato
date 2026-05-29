export const ORDER_STATUS = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    PREPARING: 'PREPARING',
    READY_FOR_PICKUP: 'READY_FOR_PICKUP',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED'
};

export const getStatusConfig = (status) => {
    switch (status) {
        case ORDER_STATUS.PENDING:
            return { label: 'Pending', color: 'text-primary bg-primary-container', progress: 10 };
        case ORDER_STATUS.ACCEPTED:
            return { label: 'Accepted', color: 'text-primary bg-primary-container', progress: 20 };
        case ORDER_STATUS.PREPARING:
            return { label: 'Preparing', color: 'text-secondary bg-secondary-container', progress: 40 };
        case ORDER_STATUS.READY_FOR_PICKUP:
            return { label: 'Ready', color: 'text-secondary bg-secondary-container', progress: 60 };
        case ORDER_STATUS.OUT_FOR_DELIVERY:
            return { label: 'Out for Delivery', color: 'text-tertiary bg-tertiary-container', progress: 80 };
        case ORDER_STATUS.DELIVERED:
            return { label: 'Delivered', color: 'text-status-success bg-status-success/20', progress: 100 };
        case ORDER_STATUS.CANCELLED:
            return { label: 'Cancelled', color: 'text-error bg-error-container', progress: 0 };
        default:
            return { label: status || 'Unknown', color: 'text-on-surface-variant bg-surface-container', progress: 0 };
    }
};

// Define active vs terminal states for polling logic
export const ACTIVE_ORDER_STATUSES = [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY_FOR_PICKUP,
    ORDER_STATUS.OUT_FOR_DELIVERY
];

export const TERMINAL_ORDER_STATUSES = [
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED
];
