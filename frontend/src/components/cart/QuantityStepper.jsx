import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

export const QuantityStepper = ({ 
    quantity, 
    onIncrement, 
    onDecrement, 
    size = 'md', 
    disabled = false 
}) => {
    const isSmall = size === 'sm';
    
    return (
        <div className={`flex items-center justify-between bg-surface border border-surface-container-highest shadow-sm font-bold overflow-hidden transition-colors ${
            isSmall ? 'h-7 rounded-md' : 'h-9 rounded-lg'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <button 
                onClick={onDecrement}
                disabled={disabled}
                className={`flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors ${
                    isSmall ? 'w-6' : 'w-8 h-full'
                }`}
                title={quantity === 1 ? 'Remove item' : 'Decrease quantity'}
            >
                {quantity === 1 ? (
                    <Trash2 className={isSmall ? "w-3 h-3 text-error" : "w-4 h-4 text-error"} />
                ) : (
                    <Minus className={isSmall ? "w-3 h-3" : "w-4 h-4"} />
                )}
            </button>
            <span className={`text-primary flex-1 text-center ${isSmall ? 'text-xs px-2' : 'text-sm px-3'}`}>
                {quantity}
            </span>
            <button 
                onClick={onIncrement}
                disabled={disabled}
                className={`flex items-center justify-center text-primary hover:bg-primary/10 transition-colors ${
                    isSmall ? 'w-6' : 'w-8 h-full'
                }`}
                title="Increase quantity"
            >
                <Plus className={isSmall ? "w-3 h-3" : "w-4 h-4"} />
            </button>
        </div>
    );
};
