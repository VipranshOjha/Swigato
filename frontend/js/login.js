import { login, isAuthenticated, getRoles, setTokens } from './auth.js';
import { showToast } from './toast.js';

// Redirect already-logged-in users to their dashboard
if (isAuthenticated()) {
    redirectByRoles(getRoles());
}

/**
 * Redirect user to the correct dashboard based on their roles.
 * Priority: admin/super_admin > restaurant_owner > customer
 */
function redirectByRoles(roles) {
    if (roles.includes('admin') || roles.includes('super_admin')) {
        window.location.href = '/admin-dashboard.html';
    } else if (roles.includes('restaurant_owner')) {
        window.location.href = '/owner-dashboard.html';
    } else if (roles.includes('delivery_partner')) {
        window.location.href = '/delivery-dashboard.html';
    } else {
        window.location.href = '/index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Password visibility toggle
    const toggleBtn = passwordInput?.nextElementSibling;
    if (toggleBtn && toggleBtn.tagName === 'BUTTON') {
        toggleBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            const icon = toggleBtn.querySelector('span');
            if (icon) icon.textContent = isPassword ? 'visibility' : 'visibility_off';
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showToast('Please enter email and password', 'error');
            return;
        }

        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging in...
        `;

        try {
            const data = await login(email, password);
            showToast('Login successful! Redirecting...', 'success');

            // Decode roles from the returned token
            let roles = [];
            try {
                const payload = JSON.parse(
                    decodeURIComponent(
                        atob(data.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
                            .split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
                    )
                );
                roles = payload.roles || [];
            } catch (_) {}

            setTimeout(() => redirectByRoles(roles), 800);
        } catch (error) {
            console.error('Login error', error);

            let errorMsg = 'Login failed. Please check your credentials.';
            const errData = error.response?.data;
            if (errData?.detail) {
                errorMsg = typeof errData.detail === 'string'
                    ? errData.detail
                    : Array.isArray(errData.detail)
                        ? errData.detail[0]?.msg || errorMsg
                        : errData.error?.message || errorMsg;
            } else if (errData?.error?.message) {
                errorMsg = errData.error.message;
            }

            showToast(errorMsg, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });
});
