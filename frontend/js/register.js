import { register, isAuthenticated } from './auth.js';
import { showToast } from './toast.js';

// Redirect if already logged in
if (isAuthenticated()) {
    window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const termsInput = document.getElementById('terms');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (termsInput && !termsInput.checked) {
            showToast('You must agree to the terms', 'error');
            return;
        }

        const fullName = fullNameInput.value.trim();
        const parts = fullName.split(' ');
        const first_name = parts[0];
        const last_name = parts.length > 1 ? parts.slice(1).join(' ') : '';

        if (!first_name) {
            showToast('Please enter your full name', 'error');
            return;
        }

        const userData = {
            first_name,
            last_name,
            email: emailInput.value.trim(),
            password: passwordInput.value,
            phone: phoneInput.value.trim() || undefined,
        };

        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Account...
        `;

        try {
            await register(userData);
            showToast('Account created! Please log in.', 'success');
            setTimeout(() => { window.location.href = '/login.html'; }, 1500);
        } catch (error) {
            console.error('Registration error', error);
            let errorMsg = 'Registration failed. Please try again.';
            const errData = error.response?.data;
            if (errData?.detail) {
                errorMsg = typeof errData.detail === 'string'
                    ? errData.detail
                    : Array.isArray(errData.detail)
                        ? errData.detail.map(e => e.msg).join(', ')
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
