import { apiFetch } from './api.js';
import { showToast } from './toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    const firstNameInput = document.getElementById('firstNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.getElementById('phoneInput');
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    // Fetch user profile on load
    try {
        const data = await apiFetch('/api/v1/users/me');
        if (data) {
            firstNameInput.value = data.first_name || '';
            lastNameInput.value = data.last_name || '';
            emailInput.value = data.email || '';
            phoneInput.value = data.phone || '';
        }
    } catch (error) {
        showToast('Failed to load profile data', 'error');
        console.error('Error fetching profile:', error);
    }

    // Save changes
    saveProfileBtn.addEventListener('click', async () => {
        const payload = {
            first_name: firstNameInput.value.trim() || undefined,
            last_name: lastNameInput.value.trim() || undefined,
            email: emailInput.value.trim() || undefined,
            phone: phoneInput.value.trim() || undefined,
        };

        const originalText = saveProfileBtn.innerText;
        saveProfileBtn.innerText = 'Saving...';
        saveProfileBtn.disabled = true;

        try {
            const data = await apiFetch('/api/v1/users/me', {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });

            if (data) {
                showToast('Profile updated successfully!', 'success');
            }
        } catch (error) {
            showToast('Failed to update profile', 'error');
            console.error('Error updating profile:', error);
        } finally {
            saveProfileBtn.innerText = originalText;
            saveProfileBtn.disabled = false;
        }
    });
});
