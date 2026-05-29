import React from 'react';

export const CheckoutSummary = ({ items }) => {
    return (
        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar border-b border-surface-container-high pb-6">
            {items?.map(item => (
                <div key={item.id} className="flex justify-between items-start text-sm group">
                    <div className="flex gap-3">
                        <div className={`w-3.5 h-3.5 mt-0.5 border flex-shrink-0 flex items-center justify-center rounded-sm ${item.is_veg ? "border-status-success" : "border-error"}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.is_veg ? "bg-status-success" : "bg-error"}`} />
                        </div>
                        <div>
                            <span className="font-medium text-on-surface block mb-0.5 leading-tight">{item.name}</span>
                            <span className="font-bold text-primary">x{item.quantity}</span>
                        </div>
                    </div>
                    <span className="font-black text-on-surface">₹{item.price * item.quantity}</span>
                </div>
            ))}
        </div>
    );
};
