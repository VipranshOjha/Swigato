import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../../services/cart.service';
import { queryKeys } from '../../lib/react-query/queryKeys';
import { mutationKeys } from '../../lib/react-query/mutationKeys';

export const useUpdateCartMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: mutationKeys.cart.update(),
        mutationFn: ({ menuItemId, quantity, isUpdate }) => {
            if (quantity === 0) {
                return cartService.removeItem(menuItemId);
            }
            if (isUpdate) {
                return cartService.updateItem(menuItemId, { quantity });
            }
            return cartService.addItem({ menu_item_id: menuItemId, quantity });
        },
        // Optimistic UI updates
        onMutate: async ({ menuItemId, quantity, itemDetails }) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: queryKeys.cart.current() });

            // Snapshot the previous value
            const previousCart = queryClient.getQueryData(queryKeys.cart.current());

            // Optimistically update to the new value
            queryClient.setQueryData(queryKeys.cart.current(), (old) => {
                const cart = old || { items: [], item_total: 0, delivery_fee: 50, taxes: 0, total_amount: 50 };
                let newItems = [...cart.items];
                
                const existingIndex = newItems.findIndex(i => i.menu_item_id === menuItemId);
                let priceDiff = 0;

                if (quantity === 0) {
                    if (existingIndex > -1) {
                        priceDiff = -(newItems[existingIndex].price * newItems[existingIndex].quantity);
                        newItems.splice(existingIndex, 1);
                    }
                } else {
                    if (existingIndex > -1) {
                        const oldQuantity = newItems[existingIndex].quantity;
                        priceDiff = newItems[existingIndex].price * (quantity - oldQuantity);
                        newItems[existingIndex] = { ...newItems[existingIndex], quantity };
                    } else if (itemDetails) {
                        priceDiff = itemDetails.price * quantity;
                        newItems.push({
                            id: 'temp-' + Date.now(),
                            menu_item_id: menuItemId,
                            quantity,
                            price: itemDetails.price,
                            name: itemDetails.name,
                            is_veg: itemDetails.is_veg
                        });
                    }
                }

                const newItemTotal = cart.item_total + priceDiff;
                const newTotalAmount = newItemTotal > 0 ? newItemTotal + cart.delivery_fee + cart.taxes : 0;
                
                // If cart is completely empty, reset everything
                if (newItems.length === 0) {
                    return null;
                }

                return {
                    ...cart,
                    items: newItems,
                    item_total: newItemTotal,
                    total_amount: newTotalAmount,
                    restaurant_id: itemDetails ? itemDetails.restaurant_id : cart.restaurant_id
                };
            });

            // Return a context object with the snapshotted value
            return { previousCart };
        },
        // If the mutation fails, use the context returned from onMutate to roll back
        onError: (err, newCartItem, context) => {
            queryClient.setQueryData(queryKeys.cart.current(), context.previousCart);
        },
        // Always refetch after error or success to sync with server
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.current() });
        },
    });
};

export const useClearCartMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: mutationKeys.cart.clear(),
        mutationFn: () => cartService.clearCart(),
        onSuccess: () => {
            queryClient.setQueryData(queryKeys.cart.current(), null);
            queryClient.invalidateQueries({ queryKey: queryKeys.cart.current() });
        }
    });
};
