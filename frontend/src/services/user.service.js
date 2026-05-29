import apiClient from '../api/api.client';

export const userService = {
    getProfile: () => apiClient.get('/users/me'),
    updateProfile: (data) => apiClient.put('/users/me', data),
    
    getAddresses: () => apiClient.get('/users/me/addresses'),
    addAddress: (data) => apiClient.post('/users/me/addresses', data),
    updateAddress: (id, data) => apiClient.put(`/users/me/addresses/${id}`, data),
    deleteAddress: (id) => apiClient.delete(`/users/me/addresses/${id}`),
};
