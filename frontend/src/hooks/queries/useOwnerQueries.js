import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query/queryKeys';
import { ownerService } from '../../services/owner.service';
import { isOrderActive } from '../../utils/order.utils';

export const useOwnerRestaurants = () => {
    return useQuery({
        queryKey: queryKeys.owner.restaurants.lists(),
        queryFn: () => ownerService.getRestaurants()
    });
};

export const useOwnerRestaurantDetail = (id) => {
    return useQuery({
        queryKey: queryKeys.owner.restaurants.detail(id),
        queryFn: () => ownerService.getRestaurant(id),
        enabled: !!id
    });
};

export const useOwnerMenuItems = (restaurantId) => {
    return useQuery({
        queryKey: queryKeys.owner.menu.items(restaurantId),
        queryFn: () => ownerService.getMenuItems(restaurantId),
        enabled: !!restaurantId
    });
};

export const useOwnerCategories = (restaurantId) => {
    return useQuery({
        queryKey: queryKeys.owner.menu.categories(restaurantId),
        queryFn: () => ownerService.getCategories(restaurantId),
        enabled: !!restaurantId
    });
};

export const useOwnerOrders = (params = {}) => {
    const isActiveFilter = params.status_filter && isOrderActive(params.status_filter);
    
    return useQuery({
        queryKey: queryKeys.owner.orders.list(params),
        queryFn: ({ signal }) => ownerService.getOrders({ ...params, signal }),
    });
};

export const useOwnerOrderDetail = (orderId) => {
    return useQuery({
        queryKey: queryKeys.owner.orders.detail(orderId),
        queryFn: () => ownerService.getOrderDetail(orderId),
        enabled: !!orderId,
    });
};

export const useOwnerReviews = (params = {}) => {
    return useQuery({
        queryKey: queryKeys.owner.reviews.list(params),
        queryFn: () => ownerService.getReviews(params)
    });
};
