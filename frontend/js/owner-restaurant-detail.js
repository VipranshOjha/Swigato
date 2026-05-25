import { ownerApi } from './api.js';
import { showToast } from './toast.js';
import { requireRole, logout } from './auth.js';

if (!requireRole('restaurant_owner')) throw new Error('Unauthorized');

const params = new URLSearchParams(window.location.search);
const restaurantId = params.get('id');
if (!restaurantId) { window.location.href = '/owner-dashboard.html'; }

document.addEventListener('DOMContentLoaded', async () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => logout());

    const form = document.getElementById('restaurantForm');
    const statusBannerEl = document.getElementById('statusBanner');
    const submitForApprovalBtn = document.getElementById('submitForApprovalBtn');
    const saveBtn = document.getElementById('saveBtn');

    // ── Load Restaurant ───────────────────────────────────────────────────
    let restaurant = null;
    try {
        const { data } = await ownerApi.get(restaurantId);
        restaurant = data;
        populateForm(data);
        updateStatusBanner(data);
    } catch (err) {
        showToast('Failed to load restaurant', 'error');
        console.error(err);
        return;
    }

    // ── Populate Form ─────────────────────────────────────────────────────
    function populateForm(r) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
        set('restaurantName', r.name);
        set('restaurantPhone', r.phone);
        set('restaurantEmail', r.email);
        set('restaurantDescription', r.description);
        set('restaurantAddress', r.address);
        set('restaurantCity', r.city);
        set('restaurantState', r.state);
        set('restaurantPostalCode', r.postal_code);
        set('restaurantCountry', r.country);
        set('restaurantDeliveryRadius', r.delivery_radius_km);
        set('restaurantMinOrder', r.minimum_order_amount);
        set('restaurantDeliveryFee', r.base_delivery_fee);
        set('restaurantFreeDelivery', r.free_delivery_above ?? '');

        document.title = `${r.name} - Edit Restaurant`;
        const nameHeading = document.getElementById('restaurantNameHeading');
        if (nameHeading) nameHeading.textContent = r.name;
    }

    function updateStatusBanner(r) {
        if (!statusBannerEl) return;
        const statusMap = {
            'DRAFT': { cls: 'bg-gray-100 border-gray-300 text-gray-700', label: 'Draft — Not submitted yet' },
            'PENDING_APPROVAL': { cls: 'bg-yellow-50 border-yellow-300 text-yellow-800', label: 'Pending Approval — Under review by admin' },
            'APPROVED': { cls: 'bg-green-50 border-green-300 text-green-800', label: '✓ Approved — Your restaurant is live!' },
            'REJECTED': { cls: 'bg-red-50 border-red-300 text-red-800', label: '✗ Rejected' },
            'SUSPENDED': { cls: 'bg-orange-50 border-orange-300 text-orange-800', label: 'Suspended by admin' },
        };
        const info = statusMap[r.approval_status] || statusMap['DRAFT'];
        statusBannerEl.className = `rounded-lg border p-4 mb-6 ${info.cls}`;
        statusBannerEl.innerHTML = `<p class="font-semibold">Status: ${info.label}</p>
            ${r.rejection_reason ? `<p class="text-sm mt-1">Reason: ${escapeHtml(r.rejection_reason)}</p>` : ''}`;

        // Show/hide submit button
        if (submitForApprovalBtn) {
            const canSubmit = r.approval_status === 'DRAFT' || r.approval_status === 'REJECTED';
            submitForApprovalBtn.classList.toggle('hidden', !canSubmit);
        }
    }

    // ── Save ─────────────────────────────────────────────────────────────
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                name: getValue('restaurantName'),
                phone: getValue('restaurantPhone'),
                email: getValue('restaurantEmail'),
                description: getValue('restaurantDescription') || null,
                address: getValue('restaurantAddress'),
                city: getValue('restaurantCity'),
                state: getValue('restaurantState'),
                postal_code: getValue('restaurantPostalCode'),
                country: getValue('restaurantCountry') || 'India',
                delivery_radius_km: parseFloat(getValue('restaurantDeliveryRadius')) || 5,
                minimum_order_amount: parseFloat(getValue('restaurantMinOrder')) || 0,
                base_delivery_fee: parseFloat(getValue('restaurantDeliveryFee')) || 0,
                free_delivery_above: parseFloat(getValue('restaurantFreeDelivery')) || null,
            };

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            try {
                const { data } = await ownerApi.update(restaurantId, payload);
                restaurant = data;
                updateStatusBanner(data);
                showToast('Restaurant updated!', 'success');
            } catch (err) {
                const msg = err.response?.data?.detail || 'Failed to save';
                showToast(typeof msg === 'string' ? msg : 'Failed to save', 'error');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }
        });
    }

    // ── Submit for Approval ───────────────────────────────────────────────
    if (submitForApprovalBtn) {
        submitForApprovalBtn.addEventListener('click', async () => {
            submitForApprovalBtn.disabled = true;
            submitForApprovalBtn.textContent = 'Submitting...';
            try {
                const { data } = await ownerApi.submit(restaurantId);
                restaurant = data;
                updateStatusBanner(data);
                showToast('Submitted for admin approval!', 'success');
            } catch (err) {
                const msg = err.response?.data?.detail || 'Failed to submit';
                showToast(typeof msg === 'string' ? msg : 'Failed to submit', 'error');
                submitForApprovalBtn.disabled = false;
                submitForApprovalBtn.textContent = 'Submit for Approval';
            }
        });
    }

    function getValue(id) {
        return document.getElementById(id)?.value?.trim() ?? '';
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
});
