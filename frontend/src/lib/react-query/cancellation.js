/**
 * Request Cancellation Support
 * ────────────────────────────
 * React Query natively supports AbortSignal via the `signal` parameter
 * passed to `queryFn`. This utility wraps API calls so they automatically
 * cancel in-flight requests when the query is invalidated, unmounted,
 * or when a new query with the same key fires (e.g. search-as-you-type).
 *
 * Usage in a queryFn:
 *
 *   queryFn: ({ signal }) => fetchWithCancel('/api/restaurants', { params }, signal)
 *
 * For Axios, pass the signal directly:
 *   apiClient.get('/restaurants', { params, signal })
 *
 * Key scenarios where cancellation matters:
 *   - Restaurant search (rapid typing)
 *   - Live filtering on owner/admin dashboards
 *   - Any typeahead/autocomplete
 *
 * React Query automatically calls signal.abort() when:
 *   1. The component unmounts before the request finishes
 *   2. The query key changes (new search term typed)
 *   3. queryClient.cancelQueries() is called explicitly
 */

import apiClient from '../../api/api.client';

/**
 * Wraps an Axios GET call with AbortSignal support.
 * Use this inside queryFn for cancellable queries.
 *
 * @param {string} url - API endpoint
 * @param {object} params - Query parameters
 * @param {AbortSignal} signal - Signal from React Query's queryFn context
 * @returns {Promise<any>} - Response data
 */
export const fetchWithCancel = async (url, params = {}, signal) => {
    return apiClient.get(url, { params, signal });
};
