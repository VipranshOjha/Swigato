import apiClient from '../api/api.client';

export const restaurantService = {
    // Public endpoints
    getPublicRestaurants: (params) => apiClient.get('/restaurants/', { params }),
    getPublicRestaurant: (id) => apiClient.get(`/restaurants/${id}`),
    getRestaurantMenu: (id) => apiClient.get(`/restaurants/${id}/menu`),
    getRestaurantReviews: (id, params) => apiClient.get(`/restaurants/${id}/reviews`, { params }),
    getRestaurantReviewSummary: (id) => apiClient.get(`/restaurants/${id}/reviews/summary`),
    
    // Owner endpoints
    getOwnerRestaurants: () => apiClient.get('/owner/restaurants'),
    createRestaurant: (data) => apiClient.post('/owner/restaurants', data),
    updateRestaurant: (id, data) => apiClient.put(`/owner/restaurants/${id}`, data),
    
    // Menu items
    getMenuItems: (restaurantId) => apiClient.get(`/owner/restaurants/${restaurantId}/items`),
    createMenuItem: (restaurantId, data) => apiClient.post(`/owner/restaurants/${restaurantId}/items`, data),
};
