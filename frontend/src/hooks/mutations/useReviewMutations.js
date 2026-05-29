import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query/queryKeys';
import { mutationKeys } from '../../lib/react-query/mutationKeys';

export const useSubmitReviewMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: mutationKeys.reviews.submit(),
        mutationFn: async (reviewData) => {
            const { default: apiClient } = await import('../../api/api.client');
            return apiClient.post('/reviews/', reviewData);
        },
        onSuccess: (data, variables) => {
            // Invalidate the specific order detail query so it refreshes and hides the review prompt if needed
            queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.order_id) });
        }
    });
};
