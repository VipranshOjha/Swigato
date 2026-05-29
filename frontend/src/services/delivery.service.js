import apiClient from '../api/api.client';

export const deliveryService = {
    // Profile
    getProfile: () => apiClient.get('/delivery/profile/me'),
    updateProfile: (data) => apiClient.patch('/delivery/profile/me', data),
    toggleOnline: (is_online) => apiClient.patch('/delivery/profile/me/online', { is_online }),
    updateLocation: (data) => apiClient.post('/delivery/profile/me/location', data),
    
    // Orders
    getAssignedOrders: (params) => apiClient.get('/delivery/orders', { params }),
    acceptOrder: (orderId) => apiClient.patch(`/delivery/orders/${orderId}/accept`),
    rejectOrder: (orderId, reason) => apiClient.patch(`/delivery/orders/${orderId}/reject`, { reason }),
    markPickedUp: (orderId) => apiClient.patch(`/delivery/orders/${orderId}/pickup`),
    markInTransit: (orderId) => apiClient.patch(`/delivery/orders/${orderId}/in-transit`),
    markDelivered: (orderId) => apiClient.patch(`/delivery/orders/${orderId}/deliver`),
};
