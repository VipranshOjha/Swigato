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
        enabled: !!orderId,
    });
};
