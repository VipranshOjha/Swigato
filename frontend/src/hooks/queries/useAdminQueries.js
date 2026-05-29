import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import { queryKeys } from '../../lib/react-query/queryKeys';

export const useAdminRestaurants = (filters = {}) => {
    return useQuery({
        queryKey: queryKeys.admin.restaurants.list(filters),
        queryFn: () => adminService.getRestaurants(filters),
        staleTime: 5 * 60 * 1000,
    });
};

export const useAdminOrders = (filters = {}) => {
    return useQuery({
        queryKey: queryKeys.admin.orders.list(filters),
        queryFn: () => adminService.getOrders(filters),
        staleTime: 60 * 1000, // 1 minute
    });
};

export const useAdminOrderDetail = (orderId) => {
    return useQuery({
        queryKey: queryKeys.admin.orders.detail(orderId),
        queryFn: () => adminService.getOrderDetail(orderId),
        enabled: !!orderId,
    });
};

export const useAdminPayments = (filters = {}) => {
    return useQuery({
        queryKey: queryKeys.admin.payments.list(filters),
        queryFn: () => adminService.getPayments(filters),
        staleTime: 60 * 1000,
    });
};

export const useAdminDeliveryPartners = (filters = {}) => {
    return useQuery({
        queryKey: queryKeys.admin.deliveryPartners.list(filters),
        queryFn: () => adminService.getDeliveryPartners(filters),
        staleTime: 5 * 60 * 1000,
    });
};

export const useAdminReviews = (filters = {}) => {
    return useQuery({
        queryKey: queryKeys.admin.reviews.list(filters),
        queryFn: () => adminService.getReviews(filters),
        staleTime: 5 * 60 * 1000,
    });
};
