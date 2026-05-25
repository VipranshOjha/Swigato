import { restaurantApi } from './api.js';
import { isAuthenticated, logout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ── Auth UI ───────────────────────────────────────────────────────────
    const authSection = document.getElementById('authSection');
    if (authSection) {
        if (isAuthenticated()) {
            authSection.innerHTML = `
                <a href="/profile-settings.html" class="font-medium text-gray-600 hover:text-orange-600">Profile</a>
                <button id="logoutBtn" class="font-medium text-gray-600 hover:text-orange-600 ml-4">Logout</button>
            `;
            document.getElementById('logoutBtn')?.addEventListener('click', () => logout());
        } else {
            authSection.innerHTML = `<a href="/login.html" class="font-medium text-orange-600 hover:text-orange-700">Login</a>`;
        }
    }

    // ── Get slug from URL ─────────────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        showError('Invalid restaurant link.');
        return;
    }

    // ── Load Restaurant Data ──────────────────────────────────────────────
    try {
        const { data: r } = await restaurantApi.get(slug);

        document.title = `${r.name} - Swigato`;

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? ''; };
        set('restaurantName', r.name);
        set('restaurantDescription', r.description || 'No description available.');
        set('restaurantAddress', r.address);
        set('restaurantCityState', `${r.city}, ${r.state} ${r.postal_code}`);
        set('restaurantPhone', r.phone);
        set('restaurantEmail', r.email);
        set('deliveryFee', r.base_delivery_fee ? `₹${r.base_delivery_fee}` : 'Free');
        set('minOrder', r.minimum_order_amount ? `₹${r.minimum_order_amount}` : 'None');
        set('deliveryRadius', `${r.delivery_radius_km} km`);

        if (r.free_delivery_above) {
            const el = document.getElementById('freeDeliveryAbove');
            if (el) el.textContent = `Free delivery above ₹${r.free_delivery_above}`;
        }

        // Open/Closed badge
        const statusEl = document.getElementById('openStatus');
        if (statusEl) {
            statusEl.textContent = r.is_open ? 'Open Now' : 'Currently Closed';
            statusEl.className = r.is_open
                ? 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'
                : 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800';
        }

        // Logo
        if (r.logo_url) {
            const logoEl = document.getElementById('logoContainer');
            if (logoEl) logoEl.innerHTML = `<img src="${escapeHtml(r.logo_url)}" class="w-full h-full object-cover" alt="${escapeHtml(r.name)} logo">`;
        }

        // Cover image
        if (r.cover_image_url) {
            const coverEl = document.getElementById('coverImage');
            if (coverEl) coverEl.innerHTML = `<img src="${escapeHtml(r.cover_image_url)}" class="w-full h-full object-cover opacity-60" alt="${escapeHtml(r.name)} cover">`;
        }

        // Categories
        const catEl = document.getElementById('restaurantCategories');
        if (catEl) {
            catEl.textContent = (r.categories || []).map(c => c.name).join(' • ');
        }

        // Operating hours
        const hoursEl = document.getElementById('operatingHours');
        if (hoursEl && r.operating_hours?.length) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            hoursEl.innerHTML = r.operating_hours
                .sort((a, b) => a.day_of_week - b.day_of_week)
                .map(h => `
                    <div class="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                        <span class="text-gray-700 font-medium">${days[h.day_of_week] || h.day_of_week}</span>
                        <span class="text-gray-500">${h.is_closed ? 'Closed' : `${h.open_time || '?'} – ${h.close_time || '?'}`}</span>
                    </div>
                `).join('');
        }

        document.getElementById('loadingState')?.classList.add('hidden');
        document.getElementById('mainContent')?.classList.remove('hidden');

    } catch (err) {
        console.error(err);
        showError(err.response?.status === 404
            ? 'Restaurant not found or not yet approved.'
            : 'Failed to load restaurant details.');
    }

    function showError(msg) {
        document.getElementById('loadingState')?.classList.add('hidden');
        document.getElementById('errorState')?.classList.remove('hidden');
        const errMsgEl = document.getElementById('errorMsg');
        if (errMsgEl) errMsgEl.textContent = msg;
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
});
