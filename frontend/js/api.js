import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth.js';

// Base API URL from environment variables
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Create the axios instance
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Handle 401s and Refresh Token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use((response) => {
    return response;
}, async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
        // If the refresh token endpoint itself fails with 401, don't loop
        if (originalRequest.url.includes('/api/v1/auth/refresh')) {
            clearTokens();
            window.location.href = '/login.html';
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise(function(resolve, reject) {
                failedQueue.push({ resolve, reject });
            }).then(token => {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
                return api(originalRequest);
            }).catch(err => {
                return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = getRefreshToken();
        if (!refreshToken) {
            clearTokens();
            window.location.href = '/login.html';
            return Promise.reject(error);
        }

        try {
            // Attempt to refresh
            const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
                refresh_token: refreshToken
            });
            
            const newAccessToken = response.data.access_token;
            // The backend might return a new refresh token as a cookie, or in the body.
            // Our backend returns it as an HttpOnly cookie currently, but wait!
            // Looking at the implementation, Swigato returns refresh_token in a cookie AND/OR requires it to be sent in JSON.
            // Wait, in `test_auth_api.py`, we test: `client.post("/api/v1/auth/refresh", json={"refresh_token": ...})`
            // So we explicitly send it.
            
            setTokens(newAccessToken, refreshToken);
            
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            
            processQueue(null, newAccessToken);
            
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            clearTokens();
            // Redirect to login
            window.location.href = '/login.html';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }

    return Promise.reject(error);
});
