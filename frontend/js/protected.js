import { isAuthenticated, getUser } from './auth.js';

if (!isAuthenticated()) {
    // Save the intended destination so we could redirect back after login
    // sessionStorage.setItem('redirect_after_login', window.location.pathname);
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
} else {
    const user = getUser();
    const path = window.location.pathname;

    if (user) {
        const role = user.role;
        const isAdminRoute = path.includes('/admin-');
        const isOwnerRoute = path.includes('/owner-') || path.includes('/restaurant-onboarding');

        if (isAdminRoute && role !== 'admin' && role !== 'super_admin') {
            window.location.href = '/';
        } else if (isOwnerRoute && role !== 'restaurant_owner' && role !== 'admin' && role !== 'super_admin') {
            window.location.href = '/';
        }
    }
}
