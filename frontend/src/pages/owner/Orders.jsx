import React, { useState } from 'react';
import { useOwnerOrders, useOwnerRestaurants } from '../../hooks/queries/useOwnerQueries';
import { useUpdateOrderStatusMutation, useAcceptOrderMutation, useRejectOrderMutation } from '../../hooks/mutations/useOwnerMutations';
import { ORDER_STATUS } from '../../utils/order.utils';
import { OrderCard } from '../../components/owner/OrderCard';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../contexts/ToastContext';

const TABS = [
    { id: 'active', label: 'Active', statuses: ['placed', 'accepted', 'preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'in_transit'] },
    { id: 'new', label: 'New (Placed)', statuses: ['placed'] },
    { id: 'preparing', label: 'Preparing', statuses: ['accepted', 'preparing'] },
    { id: 'ready', label: 'Ready', statuses: ['ready_for_pickup'] },
    { id: 'past', label: 'Past Orders', statuses: ['delivered', 'cancelled', 'rejected'] }
];

export const Orders = () => {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [restaurantFilter, setRestaurantFilter] = useState('');
    const { addToast } = useToast();
    
    const { data: restaurants } = useOwnerRestaurants();
    const { data: ordersData, isLoading, error } = useOwnerOrders({ 
        page: 1, 
        page_size: 100 
    });

    const acceptMutation = useAcceptOrderMutation();
    const rejectMutation = useRejectOrderMutation();
    const statusMutation = useUpdateOrderStatusMutation();

    const handleAction = async (orderId, action, payload = null) => {
        try {
            if (action === 'accept') {
                await acceptMutation.mutateAsync(orderId);
                addToast('Order accepted', 'success');
            } else if (action === 'reject') {
                const reason = prompt('Reason for rejection:');
                if (!reason) return;
                await rejectMutation.mutateAsync({ orderId, reason });
                addToast('Order rejected', 'success');
            } else if (action === 'status') {
                await statusMutation.mutateAsync({ orderId, newStatus: payload });
                addToast('Status updated', 'success');
            }
        } catch (err) {
            addToast(err.message || 'Action failed', 'error');
        }
    };

    const renderActions = (order) => {
        const isPending = acceptMutation.isPending || rejectMutation.isPending || statusMutation.isPending;
        
        switch (order.status) {
            case ORDER_STATUS.PLACED:
                return (
                    <>
                        <button 
                            disabled={isPending}
                            onClick={() => handleAction(order.id, 'accept')}
                            className="flex-1 bg-primary text-on-primary font-bold py-2 rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
                        >
                            Accept
                        </button>
                        <button 
                            disabled={isPending}
                            onClick={() => handleAction(order.id, 'reject')}
                            className="flex-1 bg-error-container text-error font-bold py-2 rounded-lg hover:bg-error-container/80 transition-colors"
                        >
                            Reject
                        </button>
                    </>
                );
            case ORDER_STATUS.ACCEPTED:
                return (
                    <button 
                        disabled={isPending}
                        onClick={() => handleAction(order.id, 'status', ORDER_STATUS.PREPARING)}
                        className="w-full bg-secondary text-on-secondary font-bold py-2 rounded-lg shadow-sm hover:bg-secondary/90 transition-colors"
                    >
                        Start Preparing
                    </button>
                );
            case ORDER_STATUS.PREPARING:
                return (
                    <button 
                        disabled={isPending}
                        onClick={() => handleAction(order.id, 'status', ORDER_STATUS.READY_FOR_PICKUP)}
                        className="w-full bg-tertiary text-on-tertiary font-bold py-2 rounded-lg shadow-sm hover:bg-tertiary/90 transition-colors"
                    >
                        Mark Ready for Pickup
                    </button>
                );
            default:
                return null;
        }
    };

    if (isLoading) return <PageLoader message="Loading orders..." />;
    if (error) return <ErrorState message={error.message} />;

    const orders = ordersData?.items || [];
    const filteredOrders = orders.filter(o => {
        if (restaurantFilter && o.restaurant_id !== restaurantFilter) return false;
        return activeTab.statuses.includes(o.status);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-on-surface">Order Management</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Live tracking and order fulfillment.</p>
                </div>
                
                {restaurants && restaurants.length > 1 && (
                    <div className="w-full md:w-64">
                        <select 
                            value={restaurantFilter} 
                            onChange={(e) => setRestaurantFilter(e.target.value)}
                            className="w-full bg-surface-container border border-surface-container-high rounded-lg px-3 py-2 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm font-bold"
                        >
                            <option value="">All Restaurants</option>
                            {restaurants.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 border-b border-surface-container-high">
                {TABS.map(tab => {
                    const count = orders.filter(o => tab.statuses.includes(o.status)).length;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-t-lg border-b-2 transition-colors ${
                                activeTab.id === tab.id
                                    ? 'border-primary text-primary bg-primary-container/20'
                                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                            }`}
                        >
                            {tab.label} <span className="ml-1 bg-surface-container-high px-1.5 py-0.5 rounded text-xs">{count}</span>
                        </button>
                    );
                })}
            </div>

            {filteredOrders.length === 0 ? (
                <div className="bg-surface-container-lowest p-12 rounded-xl border border-surface-container-high text-center">
                    <p className="text-on-surface font-medium text-lg">No orders found</p>
                    <p className="text-on-surface-variant mt-1">Try changing your filters or checking a different tab.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrders.map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            restaurantName={restaurants?.find(r => r.id === order.restaurant_id)?.name}
                            actions={renderActions(order)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
