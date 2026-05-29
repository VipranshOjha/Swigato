import React from 'react';
import { useCartActions } from '../../hooks/actions/useCartActions';
import { QuantityStepper } from './QuantityStepper';
import { cn } from '../common/Toast';

export const CartItemCard = ({ item, isCompact = false }) => {
    const { updateQuantity, isUpdating } = useCartActions();
    
    return (
        <div className="flex items-start gap-3 py-4 border-b border-surface-container-high last:border-0 group animate-in fade-in slide-in-from-right-4 duration-300">
            <div className={cn(
                "w-4 h-4 border flex-shrink-0 flex items-center justify-center rounded-sm mt-0.5",
                item.is_veg ? "border-status-success" : "border-error"
            )}>
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    item.is_veg ? "bg-status-success" : "bg-error"
                )} />
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface line-clamp-2 leading-tight mb-1">{item.name}</p>
                <p className="text-sm font-black text-on-surface-variant">₹{item.price}</p>
            </div>
            
            <div className={`flex ${isCompact ? 'flex-col items-end gap-2' : 'items-center gap-4'}`}>
                <QuantityStepper 
                    quantity={item.quantity}
                    onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
                    onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
                    size={isCompact ? 'sm' : 'md'}
                />
                <div className="w-14 text-right text-sm font-black text-on-surface">
                    ₹{item.price * item.quantity}
                </div>
            </div>
        </div>
    );
};
