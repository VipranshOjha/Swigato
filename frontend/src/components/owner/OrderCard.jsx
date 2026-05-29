import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { Clock, ChevronRight } from 'lucide-react';

export const OrderCard = ({ order, actions, restaurantName }) => {
    const itemSummary = order.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ');
    
    return (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-surface-container-high bg-surface-container-low/30 flex justify-between items-center">
                <div>
                    {restaurantName && (
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">{restaurantName}</span>
                    )}
                    <p className="text-sm font-bold text-on-surface">#{order.id?.substring(0, 8)}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <StatusBadge status={order.status} />
                </div>
            </div>
            
            <div className="p-4">
                <div className="space-y-1.5 mb-3">
                    {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="font-medium text-on-surface">{item.quantity}x {item.item_name}</span>
                            <span className="text-on-surface-variant">₹{item.total_price}</span>
                        </div>
                    ))}
                </div>
                
                <div className="border-t border-dashed border-surface-container-high pt-3 flex justify-between items-center">
                    <span className="font-black text-on-surface">₹{order.total_amount}</span>
                    <Link 
                        to={`/owner/orders/${order.id}`}
                        className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                        Details <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
            
            {actions && (
                <div className="p-3 border-t border-surface-container-high bg-surface-container-low/30 flex gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
};
