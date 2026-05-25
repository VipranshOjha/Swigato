import { userApi } from './api.js';
import { showToast } from './toast.js';
import { getUserProfile, logout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    // ── Load Profile ────────────────────────────────────────────────────────
    try {
        const { data } = await userApi.me();

        firstNameInput.value = data.first_name || '';
        lastNameInput.value = data.last_name || '';
        emailInput.value = data.email || '';
        phoneInput.value = data.phone || '';

        // Show roles if a roles badge element exists
        const rolesBadge = document.getElementById('rolesBadge');
        if (rolesBadge && data.roles?.length) {
            rolesBadge.textContent = data.roles.join(', ');
            rolesBadge.classList.remove('hidden');
        }

        // Show email verification status
        const emailVerifiedEl = document.getElementById('emailVerifiedStatus');
        if (emailVerifiedEl) {
            emailVerifiedEl.textContent = data.is_email_verified ? '✓ Verified' : '✗ Not verified';
            emailVerifiedEl.className = data.is_email_verified
                ? 'text-green-600 text-sm font-medium'
                : 'text-red-500 text-sm font-medium';
        }
    } catch (error) {
        showToast('Failed to load profile data', 'error');
        console.error('Error fetching profile:', error);
    }

    // ── Save Changes ────────────────────────────────────────────────────────
    saveProfileBtn.addEventListener('click', async () => {
        const payload = {};
        const first = firstNameInput.value.trim();
        const last = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();

        if (first) payload.first_name = first;
        if (last) payload.last_name = last;
        if (email) payload.email = email;
        if (phone) payload.phone = phone;

        if (Object.keys(payload).length === 0) {
            showToast('No changes to save', 'error');
            return;
        }

        const originalText = saveProfileBtn.innerText;
        saveProfileBtn.innerText = 'Saving...';
        saveProfileBtn.disabled = true;

        try {
            await userApi.updateMe(payload);
            showToast('Profile updated successfully!', 'success');
        } catch (error) {
            const msg = error.response?.data?.detail || error.response?.data?.error?.message || 'Failed to update profile';
            showToast(typeof msg === 'string' ? msg : 'Failed to update profile', 'error');
            console.error('Error updating profile:', error);
        } finally {
            saveProfileBtn.innerText = originalText;
            saveProfileBtn.disabled = false;
        }
    });

    // ── Logout button (if present) ──────────────────────────────────────────
    const logoutBtn = document.getElementById('logoutBtn') || document.getElementById('header-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => logout());
    }
});
