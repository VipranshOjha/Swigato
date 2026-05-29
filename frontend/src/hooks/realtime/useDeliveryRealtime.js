import { useQuery } from '@tanstack/react-query';

/**
 * Abstraction for realtime delivery updates.
 * Currently uses React Query polling, but can be swapped to WebSockets 
 * in the future without changing component signatures.
 * 
 * @param {Object} options
 * @param {Array} options.queryKey - React Query key
 * @param {Function} options.queryFn - Function to fetch data
 * @param {boolean} options.enabled - Whether query is enabled at all
 * @param {boolean} options.isRealtimeActive - Whether to poll/listen (e.g. rider is online, order is active)
 * @param {number} options.interval - Polling interval in ms (default 15000)
 */
export const useDeliveryRealtime = ({
    queryKey,
    queryFn,
    enabled = true,
    isRealtimeActive = false,
    interval = 15000
}) => {
    return useQuery({
        queryKey,
        queryFn,
        enabled,
        // Optional: you can add network mode adjustments or staleTime if needed
    });
};
