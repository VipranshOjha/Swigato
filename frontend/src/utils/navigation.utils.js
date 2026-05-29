/**
 * Centralized navigation path builders to prevent manual string concatenation 
 * and enforce canonical routing (e.g., using slugs over IDs).
 */

export const getRestaurantPath = (restaurant) => {
    if (!restaurant) return '/restaurants';
    
    // Support both passing the object or just the string slug directly
    const slug = typeof restaurant === 'string' ? restaurant : restaurant.slug;
    
    if (!slug) {
        console.error('CRITICAL: Missing slug for restaurant', restaurant);
        return '/restaurants';
    }
    
    return `/restaurants/${slug}`;
};

export const getOrderPath = (id) => `/orders/${id}`;

export const getOwnerRestaurantEditPath = (id) => `/owner/restaurants/${id}/edit`;
export const getOwnerMenuPath = (restaurantId) => `/owner/menu/${restaurantId}`;
export const getOwnerOrderPath = (id) => `/owner/orders/${id}`;

export const getDeliveryOrderPath = (id) => `/delivery/orders/${id}`;
