import React from 'react';
import { Clock } from 'lucide-react';
import { getStatusConfig, ORDER_STATUS } from '../../utils/orderStatus.utils';

export const DeliveryETA = ({ status, createdAt }) => {
    const { progress } = getStatusConfig(status);
    const isCancelled = status === ORDER_STATUS.CANCELLED;
    const isDelivered = status === ORDER_STATUS.DELIVERED;

    if (isCancelled || isDelivered) return null;

    // Estimate ETA based on creation time (mock logic: +45 mins)
    const orderTime = new Date(createdAt);
    const etaTime = new Date(orderTime.getTime() + 45 * 60000);
    const timeString = etaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let message = 'Arriving by';
    if (progress <= 20) message = 'Expected by';
    if (progress >= 80) message = 'Arriving very soon!';

    return (
        <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-4">
            <div className="bg-surface p-3 rounded-full shadow-sm text-primary">
                <Clock className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">{message}</p>
                <p className="text-2xl font-black text-on-surface">{timeString}</p>
            </div>
        </div>
    );
};
