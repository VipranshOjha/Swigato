import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../common/StatusBadge';
import { Clock, MapPin, IndianRupee, Navigation, CheckCircle2 } from 'lucide-react';
import { ORDER_STATUS } from '../../utils/order.utils';

export const DeliveryOrderCard = ({ order, actions }) => {
    // Determine payment type tag (Mocked if backend doesn't provide it yet)
    const isCOD = order.payment_mode === 'COD' || order.total_amount > 500; 
    const isHighValue = order.total_amount >= 1000;
    
    // Mock ETA and Distance placeholders since backend might not have them natively yet
    const estimatedDistance = (Math.random() * 5 + 1).toFixed(1) + ' km';
    const estimatedTime = Math.floor(Math.random() * 15 + 10) + ' mins';
    
    // Payout mockup (e.g., base + distance)
    const estimatedPayout = Math.floor(40 + Math.random() * 30);

    return (
        <div className={`bg-surface-container-lowest rounded-xl border-2 shadow-sm overflow-hidden transition-all hover:shadow-md
            ${order.status === ORDER_STATUS.RIDER_ASSIGNED ? 'border-primary' : 'border-surface-container-high'}
        `}>
            <div className="p-4 border-b border-surface-container-high bg-surface-container-low/30 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-on-surface uppercase tracking-wider">#{order.id?.substring(0, 8)}</span>
                        {isCOD && (
                            <span className="bg-status-warning/20 text-status-warning text-[10px] font-black px-1.5 py-0.5 rounded">COD</span>
                        )}
                        {isHighValue && (
                            <span className="bg-tertiary-container text-tertiary text-[10px] font-black px-1.5 py-0.5 rounded">HIGH VALUE</span>
                        )}
                    </div>
                    <p className="text-xl font-black text-on-surface flex items-center gap-1">
                        <IndianRupee className="w-5 h-5" /> {estimatedPayout}
                    </p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <StatusBadge status={order.status} />
                    <div className="flex items-center gap-1 text-xs font-bold text-on-surface-variant">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>
            
            <div className="p-4 space-y-4">
                {/* Route Overview */}
                <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-high">
                    {/* Pickup */}
                    <div className="relative">
                        <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-surface-container-lowest" />
                        <h4 className="text-xs font-bold text-primary uppercase">Pickup</h4>
                        <p className="text-sm font-medium text-on-surface line-clamp-1">{order.restaurant?.name || 'Restaurant'}</p>
                        <p className="text-xs text-on-surface-variant line-clamp-1">{order.restaurant?.address || 'Pickup address'}</p>
                    </div>
                    
                    {/* Dropoff */}
                    <div className="relative">
                        <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-status-success ring-4 ring-surface-container-lowest" />
                        <h4 className="text-xs font-bold text-status-success uppercase">Dropoff</h4>
                        <p className="text-sm font-medium text-on-surface line-clamp-1">{order.customer?.first_name || 'Customer'}</p>
                        <p className="text-xs text-on-surface-variant line-clamp-1">{order.delivery_address?.street || 'Delivery address'}</p>
                    </div>
                </div>

                <div className="border-t border-dashed border-surface-container-high pt-3 flex justify-between items-center bg-surface-container-low/30 -mx-4 -mb-4 p-4">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-on-surface">
                            <Navigation className="w-4 h-4 text-on-surface-variant" />
                            {estimatedDistance}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-on-surface">
                            <Clock className="w-4 h-4 text-on-surface-variant" />
                            {estimatedTime}
                        </div>
                    </div>
                    <Link 
                        to={`/delivery/orders/${order.id}`}
                        className="flex items-center gap-1 text-sm font-bold text-primary hover:underline bg-primary-container/30 px-3 py-1.5 rounded-lg"
                    >
                        View Details
                    </Link>
                </div>
            </div>
            
            {actions && (
                <div className="p-3 border-t border-surface-container-high bg-surface-container-lowest flex gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
};
