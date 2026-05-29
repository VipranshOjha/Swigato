import apiClient from '../api/api.client';

export const orderService = {
    // Customer endpoints
    getCustomerOrders: (params) => apiClient.get('/orders', { params }),
    placeOrder: (data) => apiClient.post('/orders', data),
    
    // Owner endpoints
    getRestaurantOrders: (restaurantId, params) => apiClient.get(`/owner/restaurants/${restaurantId}/orders`, { params }),
    updateOrderStatus: (restaurantId, orderId, status) => 
        apiClient.patch(`/owner/restaurants/${restaurantId}/orders/${orderId}/status`, { status }),
        
    // Delivery endpoints
    getAvailableOrders: (params) => apiClient.get('/delivery/orders/available', { params }),
    acceptOrder: (orderId) => apiClient.post(`/delivery/orders/${orderId}/accept`),
    updateDeliveryStatus: (orderId, status) => 
        apiClient.patch(`/delivery/orders/${orderId}/status`, { status }),
};
