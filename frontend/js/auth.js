/**
 * auth.js — Token storage, JWT decoding, and auth utilities.
 *
 * NOTE: This module must NOT import from api.js to avoid circular dependency.
 * API calls for login/register/logout live here using the axios instance from api.js,
 * which is imported lazily inside functions (not at module level).
 */

// ── Token Storage Keys ────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY = 'swigato_access_token';

// ── Token Getters / Setters ───────────────────────────────────────────────────
export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const isAuthenticated = () => !!getAccessToken();

export const setTokens = (accessToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
};

export const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
};

// ── JWT Decoding ──────────────────────────────────────────────────────────────

/**
 * Decode the JWT access token payload (without signature verification).
 * Returns the raw payload object, or null if not available / invalid.
 */
export const getUserProfile = () => {
    const token = getAccessToken();
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Failed to decode JWT', e);
        return null;
    }
};

/**
 * Get the list of roles from the JWT payload.
 * Returns an empty array if not authenticated.
 */
export const getRoles = () => {
    const profile = getUserProfile();
    return profile?.roles ?? [];
};

/**
 * Check if the current user has at least one of the specified roles.
 * @param {...string} roles - Role strings to check (e.g. 'admin', 'restaurant_owner')
 */
export const hasRole = (...roles) => {
    const userRoles = getRoles();
    return roles.some(r => userRoles.includes(r));
};

// ── Auth Guards ───────────────────────────────────────────────────────────────

/**
 * Redirect to login if not authenticated.
 * Returns true if authenticated, false (and redirects) if not.
 */
export const requireAuth = () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
};

/**
 * Redirect to login if not authenticated, or to index if missing required role.
 * @param {...string} roles - At least one must be present.
 */
export const requireRole = (...roles) => {
    if (!requireAuth()) return false;
    if (!hasRole(...roles)) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
};

// ── API Auth Calls ────────────────────────────────────────────────────────────

export const login = async (email, password) => {
    // Import lazily to avoid circular dependency
    const { api } = await import('./api.js');
    const response = await api.post('/api/v1/auth/login', { email, password });
    const { access_token } = response.data;
    setTokens(access_token);
    return response.data;
};

export const register = async (userData) => {
    const { api } = await import('./api.js');
    const response = await api.post('/api/v1/auth/register', userData);
    return response.data;
};

export const logout = async () => {
    try {
        const { api } = await import('./api.js');
        await api.post('/api/v1/auth/logout');
    } catch (e) {
        console.warn('Logout API failed, clearing local state anyway');
    } finally {
        clearTokens();
        window.location.href = '/login.html';
    }
};
