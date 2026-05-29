import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/order.service';
import { queryKeys } from '../../lib/react-query/queryKeys';
import { ORDER_STATUS } from '../../utils/order.utils';

export const useOrders = (params = {}) => {
    return useQuery({
        queryKey: queryKeys.orders.list(params),
        queryFn: () => orderService.getCustomerOrders(params)
    });
};

export const useOrderDetail = (id) => {
    return useQuery({
        queryKey: queryKeys.orders.detail(id),
        // Assuming the order API exists as implemented before, even though orderService didn't have it explicitly
        // If we don't have it, we use apiClient directly. But let's assume it's in orderService now.
        queryFn: async () => {
            const { default: apiClient } = await import('../../api/api.client');
            return apiClient.get(`/orders/${id}`);
        },
        enabled: !!id,
        // Optional polling if the order is active
        refetchInterval: (query) => {
            const status = query.state?.data?.status;
            const isFinished = status === ORDER_STATUS.DELIVERED || 
                               status === ORDER_STATUS.CANCELLED || 
                               status === ORDER_STATUS.REJECTED;
            
            // Poll every 30s if active, otherwise stop polling
            return (!isFinished && status) ? 30000 : false;
        }
    });
};
