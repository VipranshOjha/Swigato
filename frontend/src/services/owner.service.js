import apiClient from '../api/api.client';

export const ownerService = {
    // Restaurants
    getRestaurants: () => apiClient.get('/owner/restaurants/'),
    getRestaurant: (id) => apiClient.get(`/owner/restaurants/${id}`),
    createRestaurant: (data) => apiClient.post('/owner/restaurants/', data),
    updateRestaurant: (id, data) => apiClient.put(`/owner/restaurants/${id}`, data),
    submitRestaurant: (id) => apiClient.post(`/owner/restaurants/${id}/submit`),
    
    // Menu Categories
    getCategories: (restaurantId) => apiClient.get(`/owner/restaurants/${restaurantId}/categories`),
    createCategory: (restaurantId, data) => apiClient.post(`/owner/restaurants/${restaurantId}/categories`, data),
    updateCategory: (restaurantId, categoryId, data) => apiClient.put(`/owner/restaurants/${restaurantId}/categories/${categoryId}`, data),
    deleteCategory: (restaurantId, categoryId) => apiClient.delete(`/owner/restaurants/${restaurantId}/categories/${categoryId}`),
    
    // Menu Items
    getMenuItems: (restaurantId) => apiClient.get(`/owner/restaurants/${restaurantId}/items`),
    createMenuItem: (restaurantId, data) => apiClient.post(`/owner/restaurants/${restaurantId}/items`, data),
    updateMenuItem: (restaurantId, itemId, data) => apiClient.put(`/owner/restaurants/${restaurantId}/items/${itemId}`, data),
    deleteMenuItem: (restaurantId, itemId) => apiClient.delete(`/owner/restaurants/${restaurantId}/items/${itemId}`),
    toggleItemAvailability: (restaurantId, itemId, isAvailable) => apiClient.patch(`/owner/restaurants/${restaurantId}/items/${itemId}/availability`, { is_available: isAvailable }),
    
    // Orders
    getOrders: (params) => apiClient.get('/owner/orders', { params }),
    getOrderDetail: (orderId) => apiClient.get(`/owner/orders/${orderId}`),
    acceptOrder: (orderId) => apiClient.patch(`/owner/orders/${orderId}/accept`),
    rejectOrder: (orderId, reason) => apiClient.patch(`/owner/orders/${orderId}/reject`, { reason }),
    updateOrderStatus: (orderId, newStatus) => apiClient.patch(`/owner/orders/${orderId}/status`, null, { params: { new_status: newStatus } }),
    
    // Reviews
    getReviews: (params) => apiClient.get('/owner/reviews/', { params }),
    replyToReview: (reviewId, data) => apiClient.patch(`/owner/reviews/${reviewId}/reply`, data),
};
