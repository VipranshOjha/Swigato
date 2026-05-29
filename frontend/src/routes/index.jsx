import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';
import { PublicRoute } from './PublicRoute';

// Components
import { PageLoader } from '../components/common/PageLoader';

// Layouts
import { AuthLayout } from '../layouts/AuthLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { OwnerLayout } from '../layouts/OwnerLayout';
import { DeliveryLayout } from '../layouts/DeliveryLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Error Pages
import { NotFound } from '../pages/error/NotFound';
import { Unauthorized } from '../pages/error/Unauthorized';

// Lazy Loaded Pages
const Login = lazy(() => import('../pages/auth/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('../pages/auth/Register').then(m => ({ default: m.Register })));

// Customer Pages (Phase 2)
const Home = lazy(() => import('../pages/customer/Home').then(m => ({ default: m.Home })));
const Restaurants = lazy(() => import('../pages/customer/Restaurants').then(m => ({ default: m.Restaurants })));
const RestaurantDetail = lazy(() => import('../pages/customer/RestaurantDetail').then(m => ({ default: m.RestaurantDetail })));
const Cart = lazy(() => import('../pages/customer/Cart').then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import('../pages/customer/Checkout').then(m => ({ default: m.Checkout })));
const Orders = lazy(() => import('../pages/customer/Orders').then(m => ({ default: m.Orders })));
const OrderDetail = lazy(() => import('../pages/customer/OrderDetail').then(m => ({ default: m.OrderDetail })));
const OrderSuccess = lazy(() => import('../pages/customer/OrderSuccess').then(m => ({ default: m.OrderSuccess })));

// Owner Pages (Phase 3)
const OwnerDashboard = lazy(() => import('../pages/owner/Dashboard').then(m => ({ default: m.Dashboard })));
const OwnerRestaurants = lazy(() => import('../pages/owner/Restaurants').then(m => ({ default: m.Restaurants })));
const OwnerEditRestaurant = lazy(() => import('../pages/owner/EditRestaurant').then(m => ({ default: m.EditRestaurant })));
const OwnerMenuManagement = lazy(() => import('../pages/owner/MenuManagement').then(m => ({ default: m.MenuManagement })));
const OwnerOrders = lazy(() => import('../pages/owner/Orders').then(m => ({ default: m.Orders })));
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard').then(m => ({ default: m.Dashboard })));
const AdminRestaurants = lazy(() => import('../pages/admin/Restaurants').then(m => ({ default: m.Restaurants })));
const AdminOrders = lazy(() => import('../pages/admin/Orders').then(m => ({ default: m.Orders })));
const AdminOrderDetail = lazy(() => import('../pages/admin/OrderDetail').then(m => ({ default: m.OrderDetail })));
const AdminPayments = lazy(() => import('../pages/admin/Payments').then(m => ({ default: m.Payments })));
const AdminDeliveryPartners = lazy(() => import('../pages/admin/DeliveryPartners').then(m => ({ default: m.DeliveryPartners })));
const AdminReviews = lazy(() => import('../pages/admin/Reviews').then(m => ({ default: m.Reviews })));
const OwnerOrderDetail = lazy(() => import('../pages/owner/OrderDetail').then(m => ({ default: m.OrderDetail })));
const OwnerReviews = lazy(() => import('../pages/owner/Reviews').then(m => ({ default: m.Reviews })));
// Delivery Pages (Phase 4)
const DeliveryDashboard = lazy(() => import('../pages/delivery/Dashboard').then(m => ({ default: m.Dashboard })));
const DeliveryOrderDetail = lazy(() => import('../pages/delivery/OrderDetail').then(m => ({ default: m.OrderDetail })));

// Helper to wrap lazy components with Suspense
const Loadable = (Component) => (props) => (
    <Suspense fallback={<PageLoader />}>
        <Component {...props} />
    </Suspense>
);

export const router = createBrowserRouter([
    {
        element: <AuthLayout />,
        children: [
            { path: ROUTES.LOGIN, element: (
                <PublicRoute>
                    {Loadable(Login)()}
                </PublicRoute>
            ) },
            { path: ROUTES.REGISTER, element: (
                <PublicRoute>
                    {Loadable(Register)()}
                </PublicRoute>
            ) },
        ]
    },
    {
        path: '/',
        element: <CustomerLayout />,
        children: [
            { index: true, element: Loadable(Home)() },
            { path: 'restaurants', element: Loadable(Restaurants)() },
            { path: 'restaurants/:slug', element: Loadable(RestaurantDetail)() },
            { path: 'cart', element: Loadable(Cart)() },
            { path: 'checkout', element: (
                <ProtectedRoute>
                    {Loadable(Checkout)()}
                </ProtectedRoute>
            ) },

            { path: 'orders', element: (
                <ProtectedRoute>
                    {Loadable(Orders)()}
                </ProtectedRoute>
            ) },
            { path: 'orders/:id', element: (
                <ProtectedRoute>
                    {Loadable(OrderDetail)()}
                </ProtectedRoute>
            ) },
            { path: 'orders/:id/success', element: (
                <ProtectedRoute>
                    {Loadable(OrderSuccess)()}
                </ProtectedRoute>
            ) },
        ]
    },
    {
        path: ROUTES.OWNER_DASHBOARD,
        element: (
            <ProtectedRoute>
                <RoleRoute allowedRoles={[ROLES.RESTAURANT_OWNER]}>
                    <OwnerLayout />
                </RoleRoute>
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: Loadable(OwnerDashboard)() },
            { path: 'restaurants', element: Loadable(OwnerRestaurants)() },
            { path: 'restaurants/:id/edit', element: Loadable(OwnerEditRestaurant)() },
            { path: 'menu/:restaurantId', element: Loadable(OwnerMenuManagement)() },
            { path: 'orders', element: Loadable(OwnerOrders)() },
            { path: 'orders/:id', element: Loadable(OwnerOrderDetail)() },
            { path: 'reviews', element: Loadable(OwnerReviews)() },
        ]
    },
    {
        path: ROUTES.DELIVERY_DASHBOARD,
        element: (
            <ProtectedRoute>
                <RoleRoute allowedRoles={[ROLES.DELIVERY_PARTNER]}>
                    <DeliveryLayout />
                </RoleRoute>
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: Loadable(DeliveryDashboard)() },
            { path: 'orders/:id', element: Loadable(DeliveryOrderDetail)() },
        ]
    },
    {
        path: ROUTES.ADMIN_DASHBOARD,
        element: (
            <ProtectedRoute>
                <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminLayout />
                </RoleRoute>
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: Loadable(AdminDashboard)() },
            { path: 'restaurants', element: Loadable(AdminRestaurants)() },
            { path: 'orders', element: Loadable(AdminOrders)() },
            { path: 'orders/:id', element: Loadable(AdminOrderDetail)() },
            { path: 'payments', element: Loadable(AdminPayments)() },
            { path: 'delivery', element: Loadable(AdminDeliveryPartners)() },
            { path: 'reviews', element: Loadable(AdminReviews)() }
        ]
    },
    {
        path: '/unauthorized',
        element: <Unauthorized />
    },
    {
        path: '*',
        element: <NotFound />
    }
]);
