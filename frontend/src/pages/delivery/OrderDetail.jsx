import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDeliveryOrderDetail, useDeliveryProfile } from '../../hooks/queries/useDeliveryQueries';
import { 
    useAcceptDeliveryMutation, 
    useRejectDeliveryMutation,
    usePickupOrderMutation,
    useTransitOrderMutation,
    useDeliverOrderMutation
} from '../../hooks/mutations/useDeliveryMutations';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useToast } from '../../contexts/ToastContext';
import { ArrowLeft, MapPin, Phone, User, Store, IndianRupee, Navigation } from 'lucide-react';
import { ORDER_STATUS } from '../../utils/order.utils';
import { isDeliveryFinal } from '../../utils/delivery.utils';
import { useRealtime } from '../../hooks/useRealtime';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query/queryKeys';

export const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    
    // Polls rapidly (8s) if order is active
    const { data: order, isLoading, error } = useDeliveryOrderDetail(id);
    const { data: profile } = useDeliveryProfile();
    const queryClient = useQueryClient();
    
    useRealtime(
        profile?.id ? `delivery_partner:${profile.id}` : null,
        ['RIDER_ASSIGNED', 'ORDER_PICKED_UP', 'ORDER_IN_TRANSIT', 'ORDER_DELIVERED'],
        (envelope) => {
            if (envelope.payload?.order_id === id) {
                queryClient.invalidateQueries({ queryKey: queryKeys.delivery.orders.detail(id) });
            }
        }
    );
    const acceptMutation = useAcceptDeliveryMutation();
    const rejectMutation = useRejectDeliveryMutation();
    const pickupMutation = usePickupOrderMutation();
    const transitMutation = useTransitOrderMutation();
    const deliverMutation = useDeliverOrderMutation();

    const isPending = acceptMutation.isPending || rejectMutation.isPending || 
                      pickupMutation.isPending || transitMutation.isPending || deliverMutation.isPending;

    const handleAction = async (action) => {
        try {
            switch(action) {
                case 'accept':
                    await acceptMutation.mutateAsync(order.id);
                    addToast('Order accepted', 'success');
                    break;
                case 'reject':
                    const reason = window.prompt("Reason for rejection:");
                    if (!reason) return;
                    await rejectMutation.mutateAsync({ orderId: order.id, reason });
                    addToast('Order rejected', 'success');
                    navigate('/delivery');
                    break;
                case 'pickup':
                    await pickupMutation.mutateAsync(order.id);
                    addToast('Order picked up', 'success');
                    break;
                case 'transit':
                    await transitMutation.mutateAsync(order.id);
                    addToast('On the way to customer', 'success');
                    break;
                case 'deliver':
                    if (window.confirm("Confirm order has been handed to customer?")) {
                        await deliverMutation.mutateAsync(order.id);
                        addToast('Order delivered successfully!', 'success');
                        navigate('/delivery');
                    }
                    break;
            }
        } catch (err) {
            addToast(err.message || 'Action failed', 'error');
        }
    };

    if (isLoading) return <PageLoader message="Loading delivery details..." />;
    if (error) return <ErrorState message={error.message} />;
    if (!order) return <ErrorState message="Order not found or you don't have access." />;

    const isCOD = order.payment_mode === 'COD' || order.total_amount > 500;
    const isFinal = isDeliveryFinal(order.status);

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-4">
                <Link to="/delivery" className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-black text-on-surface flex items-center gap-3">
                        Order #{order.id.substring(0, 8)}
                    </h1>
                    <div className="mt-1 flex gap-2 items-center">
                        <StatusBadge status={order.status} />
                        {isCOD && <span className="bg-status-warning/20 text-status-warning text-[10px] font-black px-1.5 py-0.5 rounded">CASH ON DELIVERY</span>}
                    </div>
                </div>
            </div>

            {/* Map Placeholder */}
            <div className="w-full h-48 bg-surface-container rounded-xl border border-surface-container-high flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent"></div>
                <Navigation className="w-8 h-8 text-primary mb-2" />
                <p className="text-sm font-bold text-on-surface-variant z-10">Map Navigation Placeholder</p>
            </div>

            {/* Route Details */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden">
                <div className="p-4 border-b border-surface-container-high flex justify-between items-center bg-surface-container-low/30">
                    <h2 className="font-bold text-on-surface">Route Info</h2>
                    <span className="font-black text-lg text-on-surface flex items-center">
                        <IndianRupee className="w-4 h-4" /> {Math.floor(40 + Math.random() * 30)} payout
                    </span>
                </div>
                
                <div className="p-5 space-y-6">
                    {/* Pickup */}
                    <div className="relative pl-8">
                        <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        </div>
                        <div className="absolute left-[9px] top-7 bottom-[-24px] w-[2px] bg-surface-container-high" />
                        
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xs font-bold text-primary uppercase mb-1">Pickup From</h3>
                                <p className="font-bold text-on-surface text-lg flex items-center gap-2">
                                    <Store className="w-4 h-4" /> {order.restaurant?.name}
                                </p>
                                <p className="text-sm text-on-surface-variant mt-1">{order.restaurant?.address}</p>
                            </div>
                            <button className="p-2 bg-surface-container rounded-full text-primary hover:bg-primary-container">
                                <Navigation className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Dropoff */}
                    <div className="relative pl-8">
                        <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-status-success/20 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-status-success" />
                        </div>
                        
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xs font-bold text-status-success uppercase mb-1">Deliver To</h3>
                                <p className="font-bold text-on-surface text-lg flex items-center gap-2">
                                    <User className="w-4 h-4" /> {order.customer?.first_name} {order.customer?.last_name}
                                </p>
                                <p className="text-sm text-on-surface-variant mt-1">{order.delivery_address?.street}</p>
                                {order.customer?.phone && (
                                    <p className="text-sm font-medium text-on-surface mt-2 flex items-center gap-1">
                                        <Phone className="w-3.5 h-3.5" /> {order.customer.phone}
                                    </p>
                                )}
                            </div>
                            <button className="p-2 bg-surface-container rounded-full text-primary hover:bg-primary-container">
                                <Navigation className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Items Summary */}
            <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-4">
                <h3 className="font-bold text-sm text-on-surface-variant uppercase mb-3">Order Items to Verify</h3>
                <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="font-medium text-on-surface">
                                <span className="font-bold mr-2">{item.quantity}x</span> 
                                {item.item_name}
                            </span>
                        </div>
                    ))}
                </div>
                {isCOD && (
                    <div className="mt-4 p-3 bg-status-warning/10 border border-status-warning/20 rounded-lg flex justify-between items-center">
                        <span className="font-bold text-status-warning text-sm">Collect Cash From Customer</span>
                        <span className="font-black text-status-warning text-lg flex items-center">
                            <IndianRupee className="w-4 h-4" /> {order.total_amount}
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom Action Bar */}
            {!isFinal && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-container-lowest border-t border-surface-container-high shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40">
                    <div className="max-w-2xl mx-auto flex gap-3">
                        {order.status === ORDER_STATUS.RIDER_ASSIGNED && !order.rider_accepted_at && (
                            <>
                                <button 
                                    disabled={isPending}
                                    onClick={() => handleAction('reject')}
                                    className="flex-1 py-3.5 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high"
                                >
                                    Reject
                                </button>
                                <button 
                                    disabled={isPending}
                                    onClick={() => handleAction('accept')}
                                    className="flex-[2] py-3.5 bg-primary text-on-primary font-bold rounded-xl shadow-sm hover:bg-primary/90"
                                >
                                    {isPending ? 'Processing...' : 'Accept Assignment'}
                                </button>
                            </>
                        )}
                        
                        {order.status === ORDER_STATUS.RIDER_ASSIGNED && order.rider_accepted_at && (
                            <button 
                                disabled={isPending}
                                onClick={() => handleAction('pickup')}
                                className="w-full py-3.5 bg-secondary text-on-secondary font-bold rounded-xl shadow-sm hover:bg-secondary/90"
                            >
                                {isPending ? 'Processing...' : 'Mark Picked Up'}
                            </button>
                        )}
                        
                        {order.status === ORDER_STATUS.PICKED_UP && (
                            <button 
                                disabled={isPending}
                                onClick={() => handleAction('transit')}
                                className="w-full py-3.5 bg-tertiary text-on-tertiary font-bold rounded-xl shadow-sm hover:bg-tertiary/90"
                            >
                                {isPending ? 'Processing...' : 'Start Driving to Customer'}
                            </button>
                        )}
                        
                        {order.status === ORDER_STATUS.IN_TRANSIT && (
                            <button 
                                disabled={isPending}
                                onClick={() => handleAction('deliver')}
                                className="w-full py-3.5 bg-status-success text-white font-bold rounded-xl shadow-sm hover:bg-status-success/90"
                            >
                                {isPending ? 'Processing...' : (isCOD ? 'Cash Collected & Delivered' : 'Mark Delivered')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
