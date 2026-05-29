import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/order.service';
import { queryKeys } from '../../lib/react-query/queryKeys';
import { mutationKeys } from '../../lib/react-query/mutationKeys';

export const usePlaceOrderMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: mutationKeys.orders.place(),
        mutationFn: (orderData) => orderService.placeOrder(orderData),
        onSuccess: () => {
            // Invalidate the cart so it empties
            queryClient.setQueryData(queryKeys.cart.current(), null);
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
            
            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
        }
    });
};
