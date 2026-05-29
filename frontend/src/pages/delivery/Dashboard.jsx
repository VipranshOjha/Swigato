import React from 'react';
import { useDeliveryProfile, useDeliveryOrders } from '../../hooks/queries/useDeliveryQueries';
import { useAcceptDeliveryMutation, useRejectDeliveryMutation } from '../../hooks/mutations/useDeliveryMutations';
import { EarningsCard } from '../../components/delivery/EarningsCard';
import { DeliveryOrderCard } from '../../components/delivery/DeliveryOrderCard';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../contexts/ToastContext';
import { IndianRupee, Bike, Map, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ORDER_STATUS } from '../../utils/order.utils';

export const Dashboard = () => {
    const { addToast } = useToast();
    const { data: profile, isLoading: isProfileLoading, error: profileError } = useDeliveryProfile();
    
    // Conditionally poll orders if online
    const isOnline = profile?.is_online || false;
    const { data: ordersData, isLoading: isOrdersLoading, error: ordersError } = useDeliveryOrders({}, { isOnline });

    const acceptMutation = useAcceptDeliveryMutation();
    const rejectMutation = useRejectDeliveryMutation();

    const handleAccept = async (orderId) => {
        try {
            await acceptMutation.mutateAsync(orderId);
            addToast('Order accepted! Proceed to pickup.', 'success');
        } catch (err) {
            addToast('Failed to accept order', 'error');
        }
    };

    const handleReject = async (orderId) => {
        const reason = window.prompt("Reason for rejecting this order?");
        if (!reason) return;
        try {
            // Optimistic update drops it from cache instantly
            await rejectMutation.mutateAsync({ orderId, reason });
            addToast('Order rejected', 'success');
        } catch (err) {
            addToast('Failed to reject order', 'error');
        }
    };

    if (isProfileLoading) return <PageLoader message="Loading profile..." />;
    if (profileError) return <ErrorState message={profileError.message} />;

    const orders = ordersData?.items || ordersData || [];
    
    // Derived states
    const pendingAssignment = orders.filter(o => o.status === ORDER_STATUS.RIDER_ASSIGNED && !o.rider_accepted_at);
    const activeDeliveries = orders.filter(o => 
        (o.status === ORDER_STATUS.RIDER_ASSIGNED && o.rider_accepted_at) || 
        o.status === ORDER_STATUS.PICKED_UP || 
        o.status === ORDER_STATUS.IN_TRANSIT
    );
    
    // Mock earnings based on deliveries
    const totalEarnings = 1250;
    const todayDeliveries = 8;

    return (
        <div className="space-y-6">
            {!isOnline && (
                <div className="bg-surface-container p-6 rounded-2xl border-2 border-surface-container-high border-dashed text-center">
                    <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bike className="w-8 h-8 text-on-surface-variant opacity-50" />
                    </div>
                    <h2 className="text-xl font-black text-on-surface mb-2">You're currently Offline</h2>
                    <p className="text-on-surface-variant text-sm max-w-sm mx-auto">
                        Go online using the toggle in the top bar to start receiving delivery requests.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <EarningsCard 
                    title="Today's Earnings" 
                    value={`₹${totalEarnings}`} 
                    icon={IndianRupee} 
                    color="text-status-success"
                />
                <EarningsCard 
                    title="Deliveries" 
                    value={todayDeliveries} 
                    icon={CheckCircle2} 
                    color="text-primary"
                />
                <EarningsCard 
                    title="Time Online" 
                    value="4h 12m" 
                    icon={Clock} 
                    color="text-secondary"
                />
                <EarningsCard 
                    title="Acceptance" 
                    value="92%" 
                    icon={CheckCircle2} 
                    color="text-tertiary"
                />
            </div>

            {isOnline && (
                <div className="space-y-6">
                    {/* New Assignments Section */}
                    <div>
                        <h2 className="text-lg font-black text-on-surface mb-4 flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                {pendingAssignment.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-warning opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${pendingAssignment.length > 0 ? 'bg-status-warning' : 'bg-surface-container-high'}`}></span>
                            </span>
                            New Requests ({pendingAssignment.length})
                        </h2>
                        
                        {isOrdersLoading ? (
                            <PageLoader message="Scanning for requests..." inline />
                        ) : pendingAssignment.length === 0 ? (
                            <div className="bg-surface-container-lowest p-8 rounded-xl border border-surface-container-high text-center shadow-sm">
                                <Map className="w-12 h-12 text-primary mx-auto mb-3 opacity-50 animate-pulse" />
                                <p className="text-on-surface font-bold">Scanning for orders nearby...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {pendingAssignment.map(order => (
                                    <DeliveryOrderCard 
                                        key={order.id} 
                                        order={order}
                                        actions={
                                            <>
                                                <button 
                                                    disabled={acceptMutation.isPending || rejectMutation.isPending}
                                                    onClick={() => handleReject(order.id)}
                                                    className="flex-1 py-2.5 bg-surface-container text-on-surface font-bold rounded-lg hover:bg-surface-container-high transition-colors"
                                                >
                                                    Reject
                                                </button>
                                                <button 
                                                    disabled={acceptMutation.isPending || rejectMutation.isPending}
                                                    onClick={() => handleAccept(order.id)}
                                                    className="flex-[2] py-2.5 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                                                >
                                                    Accept Delivery
                                                </button>
                                            </>
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active Deliveries Section */}
                    {activeDeliveries.length > 0 && (
                        <div>
                            <h2 className="text-lg font-black text-on-surface mb-4">Active Deliveries ({activeDeliveries.length})</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {activeDeliveries.map(order => (
                                    <DeliveryOrderCard 
                                        key={order.id} 
                                        order={order}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
