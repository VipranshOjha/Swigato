import { useQueries } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query/queryKeys';
import { ownerService } from '../../services/owner.service';
import { ACTIVE_ORDER_STATUSES } from '../../utils/order.utils';

/**
 * Client-side aggregation hook for the owner dashboard.
 * No dedicated backend endpoint exists, so we aggregate from
 * restaurants + orders queries.
 */
export const useOwnerDashboard = () => {
    const results = useQueries({
        queries: [
            {
                queryKey: queryKeys.owner.restaurants.lists(),
                queryFn: () => ownerService.getRestaurants(),
            },
            {
                queryKey: queryKeys.owner.orders.list({ page: 1, page_size: 100 }),
                queryFn: () => ownerService.getOrders({ page: 1, page_size: 100 }),
                refetchInterval: 60000, // Poll every 60s for dashboard freshness
            },
        ],
    });

    const [restaurantsQuery, ordersQuery] = results;
    const isLoading = results.some(r => r.isLoading);
    const error = results.find(r => r.error)?.error;

    // Aggregate metrics
    const restaurants = restaurantsQuery.data || [];
    const ordersData = ordersQuery.data;
    const allOrders = ordersData?.items || ordersData || [];

    const activeOrders = allOrders.filter(o => ACTIVE_ORDER_STATUSES.includes(o.status));
    const placedOrders = allOrders.filter(o => o.status === 'placed');
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const recentOrders = activeOrders.slice(0, 5);

    return {
        isLoading,
        error,
        metrics: {
            totalRestaurants: restaurants.length,
            activeOrders: activeOrders.length,
            pendingOrders: placedOrders.length,
            totalRevenue,
            recentOrders,
        },
        restaurants,
    };
};
