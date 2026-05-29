import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { normalizeRoles } from '../utils/roleRedirect';
import { PageLoader } from '../components/common/PageLoader';

export const RoleRoute = ({ children, allowedRoles }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <PageLoader />;
    }

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    const userRoles = normalizeRoles(user?.roles || user?.role);
    
    // Normalize allowed roles to lowercase too just in case
    const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());
    const hasRole = normalizedAllowed.some(role => userRoles.includes(role));

    if (!hasRole) {
        // Redirect unauthorized users to their proper home
        return <Navigate to={ROUTES.HOME} replace />;
    }

    return children;
};
