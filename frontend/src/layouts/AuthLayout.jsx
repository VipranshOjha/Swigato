import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';
import { normalizeRoles } from '../utils/roleRedirect';

export const AuthLayout = () => {
    const { isAuthenticated, user } = useAuth();

    if (isAuthenticated && user) {
        // Redirect based on role if already logged in
        const userRoles = normalizeRoles(user?.roles || user?.role);
        
        if (userRoles.includes(ROLES.RESTAURANT_OWNER)) return <Navigate to={ROUTES.OWNER_DASHBOARD} replace />;
        if (userRoles.includes(ROLES.DELIVERY_PARTNER)) return <Navigate to={ROUTES.DELIVERY_DASHBOARD} replace />;
        if (userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPER_ADMIN)) return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
        return <Navigate to={ROUTES.HOME} replace />;
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-2xl shadow-lg border border-surface-container-high">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-primary mb-2">Swigato</h1>
                    <p className="text-on-surface-variant text-sm">Sign in to your account</p>
                </div>
                <Outlet />
            </div>
        </div>
    );
};
