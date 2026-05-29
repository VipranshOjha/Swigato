import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query/queryKeys';
import { fetchWithCancel } from '../../lib/react-query/cancellation';

export const useRestaurants = (params = {}) => {
    return useQuery({
        queryKey: queryKeys.restaurants.list(params),
        // Pass the signal so rapid search typing cancels stale requests
        queryFn: ({ signal }) => fetchWithCancel('/restaurants/', params, signal)
    });
};

export const useRestaurantDetail = (id) => {
    return useQuery({
        queryKey: queryKeys.restaurants.detail(id),
        queryFn: ({ signal }) => fetchWithCancel(`/restaurants/${id}`, {}, signal),
        enabled: !!id
    });
};

export const useRestaurantMenu = (id) => {
    return useQuery({
        queryKey: [...queryKeys.restaurants.detail(id), 'menu'],
        queryFn: ({ signal }) => fetchWithCancel(`/restaurants/${id}/menu`, {}, signal),
        enabled: !!id
    });
};

export const useRestaurantReviews = (id, params = {}) => {
    return useQuery({
        queryKey: [...queryKeys.restaurants.detail(id), 'reviews', params],
        queryFn: ({ signal }) => fetchWithCancel(`/restaurants/${id}/reviews`, params, signal),
        enabled: !!id
    });
};
