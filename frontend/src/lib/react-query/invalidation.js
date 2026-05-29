import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';

/**
 * Centralized invalidation helper.
 * As the app grows, invalidation logic becomes hard to reason about.
 * This maps entity mutations to the queries they should invalidate.
 *
 * Usage:
 *   invalidateByEntity('cart');
 *   invalidateByEntity('order', orderId);
 */

const invalidationMap = {
    cart: () => [
        { queryKey: queryKeys.cart.all },
    ],
    order: (id) => [
        { queryKey: queryKeys.orders.lists() },
        ...(id ? [{ queryKey: queryKeys.orders.detail(id) }] : []),
        { queryKey: queryKeys.cart.all }, // placing an order clears the cart
    ],
    review: (orderId) => [
        ...(orderId ? [{ queryKey: queryKeys.orders.detail(orderId) }] : []),
    ],
    restaurant: (id) => [
        { queryKey: queryKeys.restaurants.lists() },
        ...(id ? [{ queryKey: queryKeys.restaurants.detail(id) }] : []),
    ],
    user: () => [
        { queryKey: queryKeys.user.all },
    ],
};

export const invalidateByEntity = (entity, id) => {
    const targets = invalidationMap[entity];
    if (!targets) {
        console.warn(`[invalidateByEntity] Unknown entity: "${entity}"`);
        return;
    }

    const queries = targets(id);
    return Promise.all(
        queries.map(q => queryClient.invalidateQueries(q))
    );
};

/**
 * Hard-reset an entity's cached data (remove from cache entirely).
 * Useful for logout flows, or switching restaurant context.
 */
export const resetEntity = (entity) => {
    const rootKey = queryKeys[entity]?.all;
    if (rootKey) {
        queryClient.removeQueries({ queryKey: rootKey });
    }
};
