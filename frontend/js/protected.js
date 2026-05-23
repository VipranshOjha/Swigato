import { isAuthenticated } from './auth.js';

if (!isAuthenticated()) {
    // Save the intended destination so we could redirect back after login
    // sessionStorage.setItem('redirect_after_login', window.location.pathname);
    window.location.href = '/login.html';
}
