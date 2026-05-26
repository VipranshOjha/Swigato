import axios from 'axios';
import { getAccessToken, setTokens, clearTokens } from './auth.js';

// ── Base Configuration ────────────────────────────────────────────────────────
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ── Axios Instance ────────────────────────────────────────────────────────────
export const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,  // Send cookies (refresh token cookie)
});

// ── Menu API ──────────────────────────────────────────────────────────────────
export const menuApi = {
    // Owner endpoints
    createCategory: (restaurantId, payload) => api.post(`/api/v1/owner/restaurants/${restaurantId}/categories`, payload),
    getCategories: (restaurantId) => api.get(`/api/v1/owner/restaurants/${restaurantId}/categories`),
    updateCategory: (restaurantId, categoryId, payload) => api.put(`/api/v1/owner/restaurants/${restaurantId}/categories/${categoryId}`, payload),
    deleteCategory: (restaurantId, categoryId) => api.delete(`/api/v1/owner/restaurants/${restaurantId}/categories/${categoryId}`),

    createItem: (restaurantId, payload) => api.post(`/api/v1/owner/restaurants/${restaurantId}/items`, payload),
    getItems: (restaurantId) => api.get(`/api/v1/owner/restaurants/${restaurantId}/items`),
    updateItem: (restaurantId, itemId, payload) => api.put(`/api/v1/owner/restaurants/${restaurantId}/items/${itemId}`, payload),
    toggleItemAvailability: (restaurantId, itemId, isAvailable) => api.patch(`/api/v1/owner/restaurants/${restaurantId}/items/${itemId}/availability`, { is_available: isAvailable }),
    deleteItem: (restaurantId, itemId) => api.delete(`/api/v1/owner/restaurants/${restaurantId}/items/${itemId}`),

    // Public endpoints
    getPublicMenu: (restaurantId) => api.get(`/api/v1/restaurants/${restaurantId}/menu`),
};

// ── Cart API ──────────────────────────────────────────────────────────────────
export const cartApi = {
    getCart: () => api.get('/api/v1/cart'),
    addItem: (menuItemId, quantity) => api.post('/api/v1/cart/items', { menu_item_id: menuItemId, quantity }),
    updateItemQuantity: (menuItemId, quantity) => api.patch(`/api/v1/cart/items/${menuItemId}`, { quantity }),
    removeItem: (menuItemId) => api.delete(`/api/v1/cart/items/${menuItemId}`),
    clearCart: () => api.delete('/api/v1/cart'),
};

// ── Request Interceptor: Attach Bearer Token ──────────────────────────────────
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// ── Response Interceptor: Handle 401 + Token Refresh ─────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        error ? prom.reject(error) : prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't loop on the refresh endpoint itself
            if (originalRequest.url?.includes('/api/v1/auth/refresh')) {
                clearTokens();
                window.location.href = '/login.html';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Backend expects the refresh token in an HttpOnly cookie sent via withCredentials
                const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {}, { withCredentials: true });

                const newAccessToken = response.data.access_token;
                setTokens(newAccessToken);

                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearTokens();
                window.location.href = '/login.html';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// ── apiFetch: fetch-compatible helper wrapping axios ─────────────────────────
// Used by scripts that prefer the fetch-style interface.
export const apiFetch = async (url, options = {}) => {
    const method = (options.method || 'GET').toLowerCase();
    const body = options.body ? JSON.parse(options.body) : undefined;

    const response = await api[method](url, body);
    return response.data;
};

// ── Grouped API Services ──────────────────────────────────────────────────────

export const authApi = {
    login: (email, password) => api.post('/api/v1/auth/login', { email, password }),
    register: (data) => api.post('/api/v1/auth/register', data),
    logout: () => api.post('/api/v1/auth/logout'),
    refresh: (refresh_token) => api.post('/api/v1/auth/refresh', { refresh_token }),
    forgotPassword: (email) => api.post('/api/v1/auth/forgot-password', { email }),
    resetPassword: (data) => api.post('/api/v1/auth/reset-password', data),
    changePassword: (data) => api.post('/api/v1/auth/change-password', data),
};

export const userApi = {
    me: () => api.get('/api/v1/users/me'),
    updateMe: (data) => api.patch('/api/v1/users/me', data),
    deleteMe: () => api.delete('/api/v1/users/me'),
    myRoles: () => api.get('/api/v1/users/me/roles'),
    addresses: () => api.get('/api/v1/users/me/addresses'),
    createAddress: (data) => api.post('/api/v1/users/me/addresses', data),
    updateAddress: (id, data) => api.put(`/api/v1/users/me/addresses/${id}`, data),
    deleteAddress: (id) => api.delete(`/api/v1/users/me/addresses/${id}`),
    setDefaultAddress: (id) => api.patch(`/api/v1/users/me/addresses/${id}/default`),
};

export const ownerApi = {
    list: () => api.get('/api/v1/owner/restaurants/'),
    create: (data) => api.post('/api/v1/owner/restaurants/', data),
    get: (id) => api.get(`/api/v1/owner/restaurants/${id}`),
    update: (id, data) => api.put(`/api/v1/owner/restaurants/${id}`, data),
    submit: (id) => api.post(`/api/v1/owner/restaurants/${id}/submit`),
};

export const adminApi = {
    list: (params) => api.get('/api/v1/admin/restaurants/', { params }),
    approve: (id) => api.patch(`/api/v1/admin/restaurants/${id}/approve`),
    reject: (id, data) => api.patch(`/api/v1/admin/restaurants/${id}/reject`, data),
    suspend: (id) => api.patch(`/api/v1/admin/restaurants/${id}/suspend`),
    activate: (id) => api.patch(`/api/v1/admin/restaurants/${id}/activate`),
};

export const restaurantApi = {
    list: (params) => api.get('/api/v1/restaurants/', { params }),
    get: (slug) => api.get(`/api/v1/restaurants/${slug}`),
};

export const customerOrderApi = {
    create: (data) => api.post('/api/v1/orders', data),
    list: (params) => api.get('/api/v1/orders', { params }),
    get: (id) => api.get(`/api/v1/orders/${id}`),
    cancel: (id) => api.patch(`/api/v1/orders/${id}/cancel`),
};

export const ownerOrderApi = {
    list: (params) => api.get('/api/v1/owner/orders', { params }),
    get: (id) => api.get(`/api/v1/owner/orders/${id}`),
    accept: (id) => api.patch(`/api/v1/owner/orders/${id}/accept`),
    reject: (id, reason) => api.patch(`/api/v1/owner/orders/${id}/reject`, { reason }),
    updateStatus: (id, new_status) => api.patch(`/api/v1/owner/orders/${id}/status?new_status=${new_status}`),
};

export const adminOrderApi = {
    list: (params) => api.get('/api/v1/admin/orders', { params }),
    get: (id) => api.get(`/api/v1/admin/orders/${id}`),
};

export const paymentApi = {
    initialize: (orderId, gateway) => api.post(`/api/v1/payments/orders/${orderId}/initialize`, { gateway }),
    mockWebhook: (gateway, payload) => api.post(`/api/v1/payments/webhooks/${gateway}`, payload),
};

export const adminPaymentApi = {
    list: (params) => api.get('/api/v1/admin/payments', { params }),
    refund: (paymentId, data) => api.post(`/api/v1/payments/${paymentId}/refund`, data),
};
