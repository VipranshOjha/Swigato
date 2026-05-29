import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { extractErrorMessage } from '../../utils/api.utils';

/**
 * Retry Strategy Presets
 * ──────────────────────
 * Use these as `retry` overrides in individual queries/mutations.
 *
 *   auth queries      → RETRY_NONE    (fail fast, don't retry 401/403)
 *   analytics queries → RETRY_RELAXED (best-effort, tolerate flakes)
 *   default           → 1             (single retry for most queries)
 */
export const RETRY_NONE = 0;
export const RETRY_RELAXED = 2;
export const RETRY_DEFAULT = 1;

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: RETRY_DEFAULT,
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000,   // 10 minutes
            refetchOnWindowFocus: false,
        },
    },
    queryCache: new QueryCache({
        onError: (error, query) => {
            // Global error normalization for queries
            error.message = extractErrorMessage(error);
        }
    }),
    mutationCache: new MutationCache({
        onError: (error, variables, context, mutation) => {
            // Global error normalization for mutations
            error.message = extractErrorMessage(error);
        }
    })
});
