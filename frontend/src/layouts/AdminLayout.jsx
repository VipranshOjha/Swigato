import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminSidebar, AdminTopbar } from '../components/admin/AdminNavigation';
import { PageLoader } from '../components/common/PageLoader';

export const AdminLayout = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <PageLoader message="Verifying access..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has admin or super_admin role
    const isAdmin = user.roles && (user.roles.includes('admin') || user.roles.includes('super_admin'));
    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen bg-surface-container-low">
            <AdminSidebar />
            <div className="flex-1 flex flex-col">
                <AdminTopbar />
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
