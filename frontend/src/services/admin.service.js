import apiClient from '../api/api.client';

export const adminService = {
    // Restaurants
    getRestaurants: (params) => apiClient.get('/admin/restaurants', { params }),
    approveRestaurant: (id) => apiClient.post(`/admin/restaurants/${id}/approve`),
    rejectRestaurant: (id, reason) => apiClient.post(`/admin/restaurants/${id}/reject`, { reason }),
    suspendRestaurant: (id) => apiClient.post(`/admin/restaurants/${id}/suspend`),
    activateRestaurant: (id) => apiClient.post(`/admin/restaurants/${id}/activate`),

    // Orders
    getOrders: (params) => apiClient.get('/admin/orders', { params }),
    getOrderDetail: (id) => apiClient.get(`/admin/orders/${id}`),

    // Payments
    getPayments: (params) => apiClient.get('/admin/payments', { params }),

    // Delivery Partners
    getDeliveryPartners: (params) => apiClient.get('/admin/delivery-partners', { params }),
    verifyDeliveryPartner: (id, verify) => apiClient.patch(`/admin/delivery-partners/${id}/verify`, null, { params: { verify } }),
    suspendDeliveryPartner: (id, suspend) => apiClient.patch(`/admin/delivery-partners/${id}/suspend`, null, { params: { suspend } }),

    // Reviews
    getReviews: (params) => apiClient.get('/admin/reviews', { params }),
    moderateReview: (id, action) => apiClient.patch(`/admin/reviews/${id}/moderate`, null, { params: { action } })
};
