import React from 'react';
import { useOwnerDashboard } from '../../hooks/queries/useOwnerDashboardQuery';
import { StatCard } from '../../components/owner/StatCard';
import { OrderCard } from '../../components/owner/OrderCard';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { Store, ClipboardList, Clock, IndianRupee } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
    const { metrics, restaurants, isLoading, error } = useOwnerDashboard();

    if (isLoading) return <PageLoader message="Loading dashboard..." />;
    if (error) return <ErrorState message={error.message} />;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-on-surface">Dashboard Overview</h1>
                <p className="text-on-surface-variant text-sm mt-1">Live metrics across all your restaurants.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Active Orders" 
                    value={metrics.activeOrders} 
                    icon={ClipboardList} 
                    color="text-primary" 
                    subtitle={`${metrics.pendingOrders} pending acceptance`}
                />
                <StatCard 
                    title="Today's Revenue" 
                    value={`₹${metrics.totalRevenue.toLocaleString()}`} 
                    icon={IndianRupee} 
                    color="text-status-success" 
                />
                <StatCard 
                    title="Restaurants" 
                    value={metrics.totalRestaurants} 
                    icon={Store} 
                    color="text-tertiary" 
                    subtitle="Active locations"
                />
                <StatCard 
                    title="Recent Avg Rating" 
                    value="--" 
                    icon={Clock} 
                    color="text-status-warning" 
                    subtitle="Calculated daily"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-on-surface">Recent Active Orders</h2>
                        <Link to="/owner/orders" className="text-sm font-bold text-primary hover:underline">
                            View All
                        </Link>
                    </div>
                    
                    {metrics.recentOrders.length === 0 ? (
                        <div className="bg-surface-container-lowest p-8 rounded-xl border border-surface-container-high text-center">
                            <ClipboardList className="w-12 h-12 text-on-surface-variant mx-auto mb-3 opacity-50" />
                            <p className="text-on-surface font-medium">No active orders</p>
                            <p className="text-on-surface-variant text-sm mt-1">Waiting for customers...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {metrics.recentOrders.map(order => (
                                <OrderCard 
                                    key={order.id} 
                                    order={order} 
                                    restaurantName={restaurants.find(r => r.id === order.restaurant_id)?.name}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-on-surface">Quick Access</h2>
                        <Link to="/owner/restaurants" className="text-sm font-bold text-primary hover:underline">
                            Manage
                        </Link>
                    </div>
                    
                    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden divide-y divide-surface-container-high">
                        {restaurants.slice(0, 5).map(rest => (
                            <Link 
                                key={rest.id} 
                                to={`/owner/menu/${rest.id}`}
                                className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors"
                            >
                                <div>
                                    <h3 className="font-bold text-on-surface text-sm">{rest.name}</h3>
                                    <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                                        <span className={`w-2 h-2 rounded-full ${rest.is_open ? 'bg-status-success' : 'bg-on-surface-variant'}`} />
                                        {rest.is_open ? 'Accepting Orders' : 'Closed'}
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-primary bg-primary-container px-2 py-1 rounded">Menu</span>
                            </Link>
                        ))}
                        {restaurants.length === 0 && (
                            <div className="p-6 text-center text-on-surface-variant text-sm">
                                No restaurants added yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
