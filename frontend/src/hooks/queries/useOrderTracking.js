import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/api.client';
import { ACTIVE_ORDER_STATUSES } from '../../utils/orderStatus.utils';

export const useOrderTracking = (orderId) => {
    return useQuery({
        queryKey: ['order', orderId, 'tracking'],
        queryFn: async () => {
            const response = await apiClient.get(`/orders/${orderId}`);
            return response;
        },
        refetchInterval: (query) => {
            // Polling interval in ms
            const currentStatus = query?.state?.data?.status;
            // Only poll if the order is in an active state
            if (currentStatus && ACTIVE_ORDER_STATUSES.includes(currentStatus)) {
                return 15000;
            }
            // Stop polling once terminal
            return false;
        },
        enabled: !!orderId,
    });
};
