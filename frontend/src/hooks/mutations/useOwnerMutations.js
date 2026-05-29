import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerService } from '../../services/owner.service';
import { queryKeys } from '../../lib/react-query/queryKeys';
import { mutationKeys } from '../../lib/react-query/mutationKeys';

// --- Restaurant Mutations ---

export const useUpdateRestaurantMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.owner.updateRestaurant(),
        mutationFn: ({ id, data }) => ownerService.updateRestaurant(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.lists() });
        }
    });
};

export const useCreateRestaurantMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.owner.createRestaurant(),
        mutationFn: (data) => ownerService.createRestaurant(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.lists() });
        }
    });
};

// --- Menu Mutations ---

export const useCreateMenuItemMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.owner.createMenuItem(),
        mutationFn: ({ restaurantId, data }) => ownerService.createMenuItem(restaurantId, data),
        onSuccess: (_, { restaurantId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.menu.items(restaurantId) });
        }
    });
};

export const useUpdateMenuItemMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.owner.updateMenuItem(),
        mutationFn: ({ restaurantId, itemId, data }) => ownerService.updateMenuItem(restaurantId, itemId, data),
        onSuccess: (_, { restaurantId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.menu.items(restaurantId) });
        }
    });
};

export const useDeleteMenuItemMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.owner.deleteMenuItem(),
        mutationFn: ({ restaurantId, itemId }) => ownerService.deleteMenuItem(restaurantId, itemId),
        // Optimistic delete
        onMutate: async ({ restaurantId, itemId }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.owner.menu.items(restaurantId) });
            const previous = queryClient.getQueryData(queryKeys.owner.menu.items(restaurantId));
            queryClient.setQueryData(queryKeys.owner.menu.items(restaurantId), (old) => {
                if (!old) return old;
                if (Array.isArray(old)) return old.filter(i => i.id !== itemId);
                return old;
            });
            return { previous, restaurantId };
        },
        onError: (err, vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKeys.owner.menu.items(context.restaurantId), context.previous);
            }
        },
        onSettled: (_, __, { restaurantId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.menu.items(restaurantId) });
        }
    });
};

export const useToggleMenuItemAvailabilityMutation = () => {
    const queryClient = useQueryClient();
    let debounceTimer = null;
    
    return useMutation({
        mutationKey: mutationKeys.owner.toggleAvailability(),
        mutationFn: ({ restaurantId, itemId, isAvailable }) => {
            return new Promise((resolve, reject) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    ownerService.toggleItemAvailability(restaurantId, itemId, isAvailable)
                        .then(resolve)
                        .catch(reject);
                }, 300);
            });
        },
        // Optimistic toggle
        onMutate: async ({ restaurantId, itemId, isAvailable }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.owner.menu.items(restaurantId) });
            const previous = queryClient.getQueryData(queryKeys.owner.menu.items(restaurantId));
            queryClient.setQueryData(queryKeys.owner.menu.items(restaurantId), (old) => {
                if (!old || !Array.isArray(old)) return old;
                return old.map(item => item.id === itemId ? { ...item, is_available: isAvailable } : item);
            });
            return { previous, restaurantId };
        },
        onError: (err, vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKeys.owner.menu.items(context.restaurantId), context.previous);
            }
        },
        onSettled: (_, __, { restaurantId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.menu.items(restaurantId) });
        }
    });
};

// --- Order Mutations (NO optimistic updates - conservative approach) ---

export const useAcceptOrderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.owner.acceptOrder(),
        mutationFn: (orderId) => ownerService.acceptOrder(orderId),
        onSuccess: (_, orderId) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.orders.detail(orderId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.orders.lists() });
        }
    });
};

export const useRejectOrderMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.owner.rejectOrder(),
        mutationFn: ({ orderId, reason }) => ownerService.rejectOrder(orderId, reason),
        onSuccess: (_, { orderId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.orders.detail(orderId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.orders.lists() });
        }
    });
};

export const useUpdateOrderStatusMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.owner.updateOrderStatus(),
        mutationFn: ({ orderId, newStatus }) => ownerService.updateOrderStatus(orderId, newStatus),
        onSuccess: (_, { orderId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.orders.detail(orderId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.orders.lists() });
        }
    });
};

// --- Review Mutations ---

export const useReplyToReviewMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.owner.replyToReview(),
        mutationFn: ({ reviewId, data }) => ownerService.replyToReview(reviewId, data),
        onSuccess: () => {
            // Invalidate both owner reviews and public restaurant reviews
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.reviews.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all });
        }
    });
};
