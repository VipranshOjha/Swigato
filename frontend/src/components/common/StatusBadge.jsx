import React from 'react';
import { getOrderStatusConfig } from '../../utils/order.utils';
import { cn } from './Toast';

export const StatusBadge = ({ status, className }) => {
    const config = getOrderStatusConfig(status);

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
            config.bgColor,
            config.color,
            className
        )}>
            {config.icon}
            {config.label}
        </span>
    );
};
