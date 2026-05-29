import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '../../services/delivery.service';
import { mutationKeys } from '../../lib/react-query/mutationKeys';
import { queryKeys } from '../../lib/react-query/queryKeys';

export const useToggleOnlineMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.delivery.toggleOnline(),
        mutationFn: (isOnline) => deliveryService.toggleOnline(isOnline),
        // Important: No optimistic updates for online state.
        // It's operational state, not cosmetic. We wait for server response.
        onSuccess: (data) => {
            queryClient.setQueryData(queryKeys.delivery.profile(), data);
            
            // If going offline, might want to invalidate or clear orders,
            // but usually standard invalidation is fine.
            queryClient.invalidateQueries({ queryKey: queryKeys.delivery.orders.all });
        }
    });
};

export const useRejectDeliveryMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.delivery.rejectOrder(),
        mutationFn: ({ orderId, reason }) => deliveryService.rejectOrder(orderId, reason),
        onMutate: async ({ orderId }) => {
            // Cancel outgoing queries to prevent overwriting our optimistic state
            await queryClient.cancelQueries({ queryKey: queryKeys.delivery.orders.all });
            
            const previousOrders = queryClient.getQueryData(queryKeys.delivery.orders.list({}));
            
            // Optimistically remove the order to prevent it popping back up
            queryClient.setQueryData(queryKeys.delivery.orders.list({}), (old) => {
                if (!old) return old;
                // If it's paginated, adjust accordingly
                if (old.items) {
                    return { ...old, items: old.items.filter(o => o.id !== orderId) };
                }
                if (Array.isArray(old)) {
                    return old.filter(o => o.id !== orderId);
                }
                return old;
            });
            
            return { previousOrders };
        },
        onError: (err, newTodo, context) => {
            if (context?.previousOrders) {
                queryClient.setQueryData(queryKeys.delivery.orders.list({}), context.previousOrders);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.delivery.orders.all });
        }
    });
};

export const useAcceptDeliveryMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.delivery.acceptOrder(),
        mutationFn: (orderId) => deliveryService.acceptOrder(orderId),
        onSuccess: (_, orderId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.delivery.orders.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.delivery.orders.detail(orderId) });
        }
    });
};

export const usePickupOrderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.delivery.markPickedUp(),
        mutationFn: (orderId) => deliveryService.markPickedUp(orderId),
        onSuccess: (_, orderId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.delivery.orders.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.delivery.orders.detail(orderId) });
        }
    });
};

export const useTransitOrderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.delivery.markInTransit(),
        mutationFn: (orderId) => deliveryService.markInTransit(orderId),
        onSuccess: (_, orderId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.delivery.orders.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.delivery.orders.detail(orderId) });
        }
    });
};

export const useDeliverOrderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.delivery.markDelivered(),
        mutationFn: (orderId) => deliveryService.markDelivered(orderId),
        onSuccess: (_, orderId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.delivery.orders.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.delivery.orders.detail(orderId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.delivery.profile() }); // Invalidate profile to update total deliveries
        }
    });
};
