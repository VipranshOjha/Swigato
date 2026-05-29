import React from 'react';
import { MessageSquare } from 'lucide-react';

export const OrderNotes = ({ value, onChange }) => {
    return (
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-sm mt-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary-container text-primary p-2 rounded-lg">
                    <MessageSquare className="w-5 h-5" />
                </div>
                <h2 className="text-headline-sm font-bold text-on-surface">Delivery Instructions</h2>
            </div>
            
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Any special instructions for the restaurant or delivery partner?"
                className="w-full bg-surface-container-low border-0 rounded-xl p-4 text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/50 resize-none h-24 transition-shadow"
            />
        </div>
    );
};
