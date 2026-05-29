import React from 'react';
import { Navigation, CheckCircle2 } from 'lucide-react';

export const DeliveryAddressCard = ({ address, isSelected, onSelect }) => {
    return (
        <div 
            onClick={onSelect}
            className={`cursor-pointer border rounded-2xl p-5 transition-all relative overflow-hidden ${
                isSelected 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'border-surface-container-high hover:border-primary/50 hover:bg-surface-container-lowest bg-surface'
            }`}
        >
            {isSelected && (
                <div className="absolute top-0 right-0 bg-primary text-on-primary p-1.5 rounded-bl-2xl">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
            )}
            <div className="flex items-start gap-3 mb-2">
                <div className="mt-0.5 text-primary">
                    <Navigation className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-on-surface uppercase tracking-wider text-sm mb-1">
                        {address.type || 'Delivery Address'}
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">
                        {address.street}<br />
                        {address.city}, {address.state} {address.zip_code}
                    </p>
                </div>
            </div>
        </div>
    );
};
