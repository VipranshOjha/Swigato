import React from 'react';
import { getStatusConfig } from '../../utils/orderStatus.utils';
import { cn } from '../common/Toast';

export const OrderStatusBadge = ({ status, className }) => {
    const config = getStatusConfig(status);
    
    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider",
            config.color,
            className
        )}>
            {config.label}
        </span>
    );
};
