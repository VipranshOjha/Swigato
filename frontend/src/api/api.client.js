import axios from 'axios';
import { storageService } from '../services/storage.service';
import { extractErrorMessage } from '../utils/api.utils';

const apiClient = axios.create({
    // Vite proxy handles the base URL '/api/v1' targeting localhost:8000
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
    (config) => {
        const token = storageService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401s and Errors
apiClient.interceptors.response.use(
    (response) => {
        // Return only the response data for cleaner service logic
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Skip retry logic for login/refresh routes to avoid infinite loops
        const isAuthRoute = originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
            originalRequest._retry = true;
            try {
                // Attempt to refresh the token. 
                // The backend relies on HTTPOnly cookies for the refresh token.
                const refreshResponse = await axios.post('/api/v1/auth/refresh', {}, {
                    withCredentials: true // Important for sending the HttpOnly cookie
                });
                
                const { access_token } = refreshResponse.data;
                storageService.setToken(access_token);
                
                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear token and redirect to login
                storageService.clearToken();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        // Use normalized error extractor
        const errorMessage = extractErrorMessage(error);
        
        return Promise.reject(new Error(errorMessage));
    }
);

export default apiClient;
