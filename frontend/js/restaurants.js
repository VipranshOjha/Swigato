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

    const searchInput = document.getElementById('searchInput');
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const grid = document.getElementById('restaurantsGrid');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    const currentCityEl = document.getElementById('currentCity');

    searchBtn?.addEventListener('click', () => loadRestaurants(searchInput?.value, cityInput?.value));
    searchInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') loadRestaurants(searchInput.value, cityInput?.value); });
    cityInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') loadRestaurants(searchInput?.value, cityInput.value); });

    async function loadRestaurants(query = '', city = '') {
        if (grid) grid.innerHTML = '';
        loadingState?.classList.remove('hidden');
        errorState?.classList.add('hidden');
        emptyState?.classList.add('hidden');
        if (currentCityEl) currentCityEl.textContent = city || 'Everywhere';

        try {
            const params = { page: 1, page_size: 20 };
            if (query) params.query = query;
            if (city) params.city = city;

            const { data } = await restaurantApi.list(params);
            loadingState?.classList.add('hidden');

            if (data.items && data.items.length > 0) {
                grid.innerHTML = data.items.map(r => `
                    <a href="/restaurant.html?slug=${encodeURIComponent(r.slug)}"
                       class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden block">
                        <div class="h-40 bg-gray-100 relative flex items-center justify-center">
                            ${r.cover_image_url
                                ? `<img src="${escapeHtml(r.cover_image_url)}" class="w-full h-full object-cover" alt="${escapeHtml(r.name)}">`
                                : `<svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`
                            }
                            ${r.is_open
                                ? '<span class="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Open</span>'
                                : '<span class="absolute top-2 left-2 bg-gray-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">Closed</span>'
                            }
                        </div>
                        <div class="p-4">
                            <h3 class="text-base font-bold text-gray-900 truncate">${escapeHtml(r.name)}</h3>
                            <p class="text-sm text-gray-500 mt-0.5 truncate">${escapeHtml(r.city)}, ${escapeHtml(r.state)}</p>
                            ${r.categories?.length ? `<p class="text-xs text-orange-500 mt-1">${r.categories.map(c => escapeHtml(c.name)).join(' · ')}</p>` : ''}
                            <div class="flex items-center justify-between mt-3 text-sm">
                                <span class="text-gray-500">Min order: ₹${r.minimum_order_amount || 0}</span>
                                <span class="text-gray-500">${r.delivery_radius_km} km radius</span>
                            </div>
                            <div class="mt-2 text-sm">
                                <span class="text-gray-600">Delivery: ${r.base_delivery_fee ? `₹${r.base_delivery_fee}` : 'Free'}</span>
                                ${r.free_delivery_above ? `<span class="text-green-600 ml-2">Free above ₹${r.free_delivery_above}</span>` : ''}
                            </div>
                        </div>
                    </a>
                `).join('');
            } else {
                emptyState?.classList.remove('hidden');
            }
        } catch (err) {
            console.error(err);
            loadingState?.classList.add('hidden');
            errorState?.classList.remove('hidden');
        }
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    loadRestaurants();
});
