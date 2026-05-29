import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoleDashboardRoute } from '../utils/roleRedirect';
import { PageLoader } from '../components/common/PageLoader';

export const PublicRoute = ({ children }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    // Prevent redirecting while auth state is still hydrating
    if (isLoading) {
        return <PageLoader />;
    }

    if (isAuthenticated && user) {
        // Preserve redirect intent if they were sent to login from a protected route
        const from = location.state?.from?.pathname || getRoleDashboardRoute(user);
        return <Navigate to={from} replace />;
    }

    return children;
};
