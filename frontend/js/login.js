import { login, isAuthenticated } from './auth.js';
import { showToast } from './toast.js';

// Redirect if already logged in
if (isAuthenticated()) {
    window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Toggle password visibility
    const toggleBtn = passwordInput.nextElementSibling;
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggleBtn.querySelector('span').textContent = type === 'password' ? 'visibility_off' : 'visibility';
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

        // Set loading state
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging in...
        `;

        try {
            await login(email, password);
            showToast('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        } catch (error) {
            console.error('Login error', error);
            
            let errorMsg = 'Login failed. Please check your credentials.';
            if (error.response?.data?.detail) {
                // Handle Pydantic validation errors or explicit HTTP exceptions
                if (typeof error.response.data.detail === 'string') {
                    errorMsg = error.response.data.detail;
                } else if (Array.isArray(error.response.data.detail)) {
                    errorMsg = error.response.data.detail[0].msg;
                } else if (error.response.data.error?.message) {
                    errorMsg = error.response.data.error.message;
                }
            } else if (error.response?.data?.error?.message) {
                 errorMsg = error.response.data.error.message;
            }

            showToast(errorMsg, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });
});
