import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/admin.service';
import { mutationKeys } from '../../lib/react-query/mutationKeys';
import { queryKeys } from '../../lib/react-query/queryKeys';

export const useApproveRestaurantMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.admin.approveRestaurant(),
        mutationFn: (id) => adminService.approveRestaurant(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.restaurants.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.lists() });
        }
    });
};

export const useRejectRestaurantMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.admin.rejectRestaurant(),
        mutationFn: ({ id, reason }) => adminService.rejectRestaurant(id, reason),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.restaurants.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.lists() });
        }
    });
};

export const useSuspendRestaurantMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.admin.suspendRestaurant(),
        mutationFn: (id) => adminService.suspendRestaurant(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.restaurants.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.lists() });
        }
    });
};

export const useActivateRestaurantMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.admin.activateRestaurant(),
        mutationFn: (id) => adminService.activateRestaurant(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.restaurants.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.detail(id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.lists() });
        }
    });
};

export const useVerifyDeliveryPartnerMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.admin.verifyDeliveryPartner(),
        mutationFn: ({ id, verify }) => adminService.verifyDeliveryPartner(id, verify),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.deliveryPartners.all });
        }
    });
};

export const useSuspendDeliveryPartnerMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.admin.suspendDeliveryPartner(),
        mutationFn: ({ id, suspend }) => adminService.suspendDeliveryPartner(id, suspend),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.deliveryPartners.all });
        }
    });
};

export const useModerateReviewMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: mutationKeys.admin.moderateReview(),
        mutationFn: ({ id, action }) => adminService.moderateReview(id, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.reviews.all });
        }
    });
};
