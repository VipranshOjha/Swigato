import React from 'react';
import { getStatusConfig, ORDER_STATUS } from '../../utils/orderStatus.utils';
import { Check, CircleDashed } from 'lucide-react';

export const OrderTimeline = ({ currentStatus }) => {
    const { progress } = getStatusConfig(currentStatus);
    const isCancelled = currentStatus === ORDER_STATUS.CANCELLED;

    const stages = [
        { label: 'Order Placed', target: 10 },
        { label: 'Preparing', target: 40 },
        { label: 'Out for Delivery', target: 80 },
        { label: 'Delivered', target: 100 }
    ];

    if (isCancelled) {
        return (
            <div className="bg-error-container/30 border border-error-container p-6 rounded-2xl text-center">
                <h3 className="text-error font-black text-lg mb-1">Order Cancelled</h3>
                <p className="text-on-surface-variant text-sm">This order was cancelled and will not be delivered.</p>
            </div>
        );
    }

    return (
        <div className="py-6">
            <div className="relative">
                {/* Progress Bar Background */}
                <div className="absolute top-4 left-0 right-0 h-1 bg-surface-container-high rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all duration-1000 ease-in-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Stages */}
                <div className="relative flex justify-between">
                    {stages.map((stage, idx) => {
                        const isCompleted = progress >= stage.target;
                        const isCurrent = progress > (stages[idx-1]?.target || 0) && progress <= stage.target;

                        return (
                            <div key={stage.label} className="flex flex-col items-center gap-3 z-10 w-24">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-500 ${
                                    isCompleted 
                                        ? 'bg-primary text-on-primary ring-4 ring-primary/20' 
                                        : 'bg-surface border-2 border-surface-container-highest text-on-surface-variant'
                                }`}>
                                    {isCompleted ? <Check className="w-5 h-5" /> : <CircleDashed className="w-5 h-5 opacity-50" />}
                                </div>
                                <span className={`text-xs text-center leading-tight ${
                                    isCompleted ? 'font-bold text-on-surface' : 'font-medium text-on-surface-variant'
                                }`}>
                                    {stage.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
