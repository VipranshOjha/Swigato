import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { storageService } from '../services/storage.service';
import { useToast } from './ToastContext';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    const fetchUser = useCallback(async () => {
        const token = storageService.getToken();
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const data = await authService.getCurrentUser();
            setUser(data);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Auth hydration failed:", error);
            storageService.clearToken();
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = async (email, password) => {
        try {
            const data = await authService.login(email, password);
            storageService.setToken(data.access_token);
            // Refresh user details
            const userData = await authService.getCurrentUser();
            setUser(userData);
            setIsAuthenticated(true);
            return userData;
        } catch (error) {
            addToast(error.message || 'Login failed', 'error');
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (e) {
            console.error("Logout failed:", e);
        } finally {
            storageService.clearToken();
            setUser(null);
            setIsAuthenticated(false);
            window.location.href = '/login';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
                <Loader2 className="w-10 h-10 animate-spin text-primary-container mb-4" />
                <p className="text-on-surface-variant font-body-md">Loading Swigato...</p>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
