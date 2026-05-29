import React from 'react';

export const OrderPriceBreakdown = ({ 
    itemTotal = 0, 
    deliveryFee = 50, 
    taxes = 0, 
    totalAmount = 0,
    isPaid = false
}) => {
    return (
        <div className="space-y-3 text-sm">
            <div className="flex justify-between text-on-surface-variant">
                <span>Item Total</span>
                <span className="font-medium text-on-surface">₹{itemTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
                <span>Delivery Fee</span>
                <span className="font-medium text-on-surface">₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
                <span>Taxes & Charges</span>
                <span className="font-medium text-on-surface">₹{taxes.toFixed(2)}</span>
            </div>
            
            <div className="pt-4 mt-4 border-t border-surface-container-high flex justify-between items-center">
                <span className="font-bold text-on-surface">
                    {isPaid ? 'Total Paid' : 'To Pay'}
                </span>
                <span className="font-black text-xl text-on-surface">
                    ₹{totalAmount.toFixed(2)}
                </span>
            </div>
        </div>
    );
};
