import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query/queryKeys';
import { deliveryService } from '../../services/delivery.service';
import { useDeliveryRealtime } from '../realtime/useDeliveryRealtime';
import { isDeliveryActive } from '../../utils/delivery.utils';

export const useDeliveryProfile = () => {
    return useQuery({
        queryKey: queryKeys.delivery.profile(),
        queryFn: () => deliveryService.getProfile(),
    });
};

export const useDeliveryOrders = (params = {}, options = {}) => {
    const { isOnline } = options;
    
    return useDeliveryRealtime({
        queryKey: queryKeys.delivery.orders.list(params),
        queryFn: () => deliveryService.getAssignedOrders(params),
        enabled: true,
        // Poll every 15s ONLY if rider is online
        isRealtimeActive: isOnline,
        interval: 15000
    });
};

export const useDeliveryOrderDetail = (orderId, options = {}) => {
    // We assume options.status might be passed to optimize when to stop polling,
    // otherwise we can derive it from the query data.
    return useQuery({
        queryKey: queryKeys.delivery.orders.detail(orderId),
        queryFn: () => deliveryService.getAssignedOrders({ id: orderId }).then(res => {
            // Backend returns a paginated list for orders. 
            // If there's a specific detail endpoint we'd use it, but list endpoint works with filtering.
            // Wait, does backend have /delivery/orders/{orderId}? Let's assume we fetch from list or standard orders API if needed.
            // Actually, based on backend research, there's only a list endpoint `GET /delivery/orders`. No separate detail endpoint.
            // We just use the list endpoint and find the order locally, or assume the backend accepts `order_id` param.
            const items = res?.items || res || [];
            return items.find(o => o.id === orderId) || null;
        }),
        enabled: !!orderId,
        refetchInterval: (query) => {
            const status = query.state?.data?.status;
            // 8s active polling
            return (status && isDeliveryActive(status)) ? 8000 : false;
        }
    });
};
