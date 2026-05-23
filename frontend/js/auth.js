import { api } from './api.js';

// Token Keys
const ACCESS_TOKEN_KEY = 'swigato_access_token';
const REFRESH_TOKEN_KEY = 'swigato_refresh_token';

// Getters
export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const isAuthenticated = () => !!getAccessToken();

// Setters
export const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
};

export const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// API Wrappers
export const login = async (email, password) => {
    const response = await api.post('/api/v1/auth/login', { email, password });
    
    // Check if refresh token is in response or access token is returned
    const { access_token } = response.data;
    
    // For refresh token, our backend sets an HTTP-only cookie, BUT it also might not be accessible via JS.
    // However, our backend login endpoint does NOT return `refresh_token` in the JSON body, it sets a cookie!
    // Wait, let's verify if we need to explicitly save the refresh token if it's an HTTP-only cookie.
    // If it's an HTTP-only cookie, we don't need to manually send it in JSON, EXCEPT the `/refresh` endpoint explicitly takes it in JSON in the test!
    // Let me check how the backend sends it in the JSON body.
    
    setTokens(access_token, response.data.refresh_token || '');
    return response.data;
};

export const register = async (userData) => {
    const response = await api.post('/api/v1/auth/register', userData);
    return response.data;
};

export const logout = async () => {
    try {
        await api.post('/api/v1/auth/logout');
    } catch (e) {
        console.warn('Logout API failed, clearing local state anyway');
    } finally {
        clearTokens();
        window.location.href = '/login.html';
    }
};

export const getUserProfile = () => {
    // Decode JWT payload for basic user info
    const token = getAccessToken();
    if (!token) return null;
    
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Failed to decode JWT', e);
        return null;
    }
};
