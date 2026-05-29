import apiClient from '../api/api.client';

export const cartService = {
    getCart: () => apiClient.get('/cart/'),
    addItem: (data) => apiClient.post('/cart/items', data),
    updateItem: (itemId, data) => apiClient.patch(`/cart/items/${itemId}`, data),
    removeItem: (itemId) => apiClient.delete(`/cart/items/${itemId}`),
    clearCart: () => apiClient.delete('/cart/'),
};
