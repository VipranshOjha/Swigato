import apiClient from '../api/api.client';

export const authService = {
    login: async (email, password) => {
        return apiClient.post('/auth/login', { email, password });
    },

    register: async (userData) => {
        return apiClient.post('/auth/register', userData);
    },

    logout: async () => {
        // Calling logout removes the refresh token cookie
        return apiClient.post('/auth/logout', { logout_all_devices: false });
    },

    getCurrentUser: async () => {
        return apiClient.get('/users/me');
    }
};
