import React from 'react';

export const RestaurantCardSkeleton = () => (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden border border-surface-container-high shadow-sm animate-pulse">
        <div className="h-48 bg-surface-container-high w-full" />
        <div className="p-4 space-y-3">
            <div className="h-6 bg-surface-container-high rounded-md w-3/4" />
            <div className="h-4 bg-surface-container-high rounded-md w-1/2" />
            <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-surface-container-high rounded-md w-16" />
                <div className="h-4 bg-surface-container-high rounded-md w-24" />
            </div>
        </div>
    </div>
);

export const MenuItemSkeleton = () => (
    <div className="flex gap-4 p-4 bg-surface-container-lowest border-b border-surface-container-high animate-pulse">
        <div className="flex-1 space-y-3 py-1">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-surface-container-high rounded-sm" />
                <div className="h-5 bg-surface-container-high rounded-md w-1/2" />
            </div>
            <div className="h-4 bg-surface-container-high rounded-md w-20" />
            <div className="h-3 bg-surface-container-high rounded-md w-full" />
            <div className="h-3 bg-surface-container-high rounded-md w-2/3" />
        </div>
        <div className="w-28 flex flex-col items-center gap-2">
            <div className="w-28 h-28 bg-surface-container-high rounded-xl" />
            <div className="w-24 h-8 bg-surface-container-high rounded-lg absolute -bottom-4 shadow-sm" />
        </div>
    </div>
);

export const OrderSkeleton = () => (
    <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container-high shadow-sm mb-4 animate-pulse">
        <div className="flex justify-between items-start mb-4">
            <div className="flex gap-4">
                <div className="w-16 h-16 bg-surface-container-high rounded-lg" />
                <div className="space-y-2 py-1">
                    <div className="h-5 bg-surface-container-high rounded-md w-32" />
                    <div className="h-4 bg-surface-container-high rounded-md w-24" />
                </div>
            </div>
            <div className="h-6 bg-surface-container-high rounded-full w-24" />
        </div>
        <div className="border-t border-surface-container-high pt-4 flex justify-between items-center">
            <div className="h-4 bg-surface-container-high rounded-md w-48" />
            <div className="h-6 bg-surface-container-high rounded-md w-16" />
        </div>
    </div>
);
