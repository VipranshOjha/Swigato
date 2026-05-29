import React from 'react';
import { useCartActions } from '../../hooks/actions/useCartActions';
import { cn } from '../common/Toast';

export const CartItem = ({ item }) => {
    const { updateQuantity } = useCartActions();
    
    return (
        <div className="flex items-center gap-3 py-3 border-b border-surface-container-high last:border-0">
            <div className={cn(
                "w-4 h-4 border flex-shrink-0 flex items-center justify-center rounded-sm",
                item.is_veg ? "border-status-success" : "border-error"
            )}>
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    item.is_veg ? "bg-status-success" : "bg-error"
                )} />
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface line-clamp-2">{item.name}</p>
                <p className="text-xs text-on-surface-variant">₹{item.price}</p>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-between bg-surface border border-surface-container-highest rounded-lg shadow-sm font-bold overflow-hidden h-8 w-20">
                    <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-full text-on-surface-variant hover:bg-surface-container-low flex items-center justify-center transition-colors text-lg"
                    >
                        -
                    </button>
                    <span className="text-primary text-sm">{item.quantity}</span>
                    <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-full text-primary hover:bg-primary/10 flex items-center justify-center transition-colors text-lg"
                    >
                        +
                    </button>
                </div>
                
                <div className="w-12 text-right text-sm font-bold text-on-surface">
                    ₹{item.price * item.quantity}
                </div>
            </div>
        </div>
    );
};
