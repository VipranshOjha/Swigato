import { ownerApi } from './api.js';
import { showToast } from './toast.js';
import { requireRole, logout, getUserProfile } from './auth.js';

// ── Auth Guard ────────────────────────────────────────────────────────────────
if (!requireRole('restaurant_owner')) throw new Error('Unauthorized');

document.addEventListener('DOMContentLoaded', async () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => logout());

    const user = getUserProfile();
    const ownerNameEl = document.getElementById('ownerName');
    if (ownerNameEl && user) ownerNameEl.textContent = `Owner #${user.sub}`;

    const form = document.getElementById('onboardingForm');
    const messageContainer = document.getElementById('messageContainer');
    const submitBtn = document.getElementById('submitBtn');

    function showSuccess(msg) {
        if (!messageContainer) return;
        messageContainer.className = 'mb-6 p-4 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200 block';
        messageContainer.innerText = msg;
    }

    function showError(msg) {
        if (!messageContainer) return;
        messageContainer.className = 'mb-6 p-4 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200 block';
        messageContainer.innerText = msg;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const countryEl = document.getElementById('country');
        const payload = {
            name: document.getElementById('name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            description: document.getElementById('description')?.value.trim() || null,
            address: document.getElementById('address').value.trim(),
            city: document.getElementById('city').value.trim(),
            state: document.getElementById('state').value.trim(),
            postal_code: document.getElementById('postal_code').value.trim(),
            country: countryEl?.value.trim() || 'India',
            delivery_radius_km: 5.0,
            minimum_order_amount: 0.0,
            base_delivery_fee: 0.0,
        };

        // Basic validation
        const required = ['name', 'phone', 'email', 'address', 'city', 'state', 'postal_code'];
        for (const field of required) {
            if (!payload[field]) {
                showError(`Please fill in the ${field.replace('_', ' ')} field.`);
                return;
            }
        }

        submitBtn.disabled = true;
        submitBtn.innerText = 'Submitting...';

        try {
            // Step 1: Create restaurant (DRAFT status)
            const { data: restaurant } = await ownerApi.create(payload);
            const restaurantId = restaurant.id;

            // Step 2: Submit for approval
            await ownerApi.submit(restaurantId);

            showSuccess('Restaurant submitted for admin approval! You will be notified once reviewed.');
            form.reset();

            // Redirect to owner dashboard after a moment
            setTimeout(() => { window.location.href = '/owner-dashboard.html'; }, 2500);
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || 'Failed to register restaurant.';
            showError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Register Restaurant';
        }
    });
});
