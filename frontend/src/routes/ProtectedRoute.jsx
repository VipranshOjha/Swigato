import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { PageLoader } from '../components/common/PageLoader';
import { normalizeRoles } from '../utils/roleRedirect';

export const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    // Quick role check if specified directly on ProtectedRoute
    if (requiredRole) {
        const userRoles = normalizeRoles(user?.roles || user?.role);
            
        if (!userRoles.includes(requiredRole.toLowerCase())) {
            return <Navigate to={ROUTES.HOME} replace />;
        }
    }

    return children;
};
