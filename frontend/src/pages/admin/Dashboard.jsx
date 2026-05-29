import React from 'react';
import { Store, ShoppingBag, CreditCard, Bike, Users } from 'lucide-react';
import { StatCard } from '../../components/admin/Shared';
import { useAdminRestaurants, useAdminOrders, useAdminDeliveryPartners } from '../../hooks/queries/useAdminQueries';
import { Link } from 'react-router-dom';
import { useRealtime } from '../../hooks/useRealtime';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query/queryKeys';

export const Dashboard = () => {
    // We only fetch page=1, page_size=1 to get the 'total' count from the paginated response
    const { data: restaurantsData } = useAdminRestaurants({ page_size: 1 });
    const { data: ordersData } = useAdminOrders({ page_size: 1 });
    const { data: partnersData } = useAdminDeliveryPartners({ page_size: 1 });

    const queryClient = useQueryClient();
    useRealtime(
        'admin:system',
        ['ORDER_CREATED', 'ORDER_ACCEPTED', 'ORDER_REJECTED', 'ORDER_CANCELLED', 'ORDER_DELIVERED'],
        () => {
            // Only invalidating the exact query key the hook produces for the metric
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.list({ page_size: 1 }) });
        }
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-on-surface tracking-tight">Overview</h1>
                <p className="text-on-surface-variant mt-1 font-medium">Platform health and operational metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/admin/orders" className="block hover:-translate-y-1 transition-transform">
                    <StatCard 
                        title="Total Orders" 
                        value={ordersData?.total || '...'} 
                        icon={ShoppingBag} 
                        colorClass="text-primary" 
                        subtitle="All time platform orders"
                    />
                </Link>
                <Link to="/admin/restaurants" className="block hover:-translate-y-1 transition-transform">
                    <StatCard 
                        title="Restaurants" 
                        value={restaurantsData?.total || '...'} 
                        icon={Store} 
                        colorClass="text-secondary" 
                        subtitle="Registered restaurants"
                    />
                </Link>
                <Link to="/admin/delivery" className="block hover:-translate-y-1 transition-transform">
                    <StatCard 
                        title="Delivery Partners" 
                        value={partnersData?.total || '...'} 
                        icon={Bike} 
                        colorClass="text-tertiary" 
                        subtitle="Registered riders"
                    />
                </Link>
                <div className="block cursor-default">
                    <StatCard 
                        title="Platform Revenue" 
                        value="₹ --" 
                        icon={CreditCard} 
                        colorClass="text-status-success" 
                        subtitle="Pending analytics integration"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-sm">
                    <h2 className="text-xl font-black text-on-surface mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link to="/admin/restaurants" className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors">
                            <span className="font-bold text-on-surface">Review Pending Restaurants</span>
                            <span className="text-primary font-black">&rarr;</span>
                        </Link>
                        <Link to="/admin/delivery" className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors">
                            <span className="font-bold text-on-surface">Verify Delivery Partners</span>
                            <span className="text-primary font-black">&rarr;</span>
                        </Link>
                        <Link to="/admin/reviews" className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors">
                            <span className="font-bold text-on-surface">Moderate Recent Reviews</span>
                            <span className="text-primary font-black">&rarr;</span>
                        </Link>
                    </div>
                </div>
                
                <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-sm flex flex-col justify-center items-center text-center text-on-surface-variant h-full min-h-[250px]">
                    <Users className="w-12 h-12 mb-3 opacity-50" />
                    <p className="font-bold">Advanced Analytics</p>
                    <p className="text-sm mt-1">Analytics module will be integrated in Phase 10.</p>
                </div>
            </div>
        </div>
    );
};
