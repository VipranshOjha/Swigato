import { restaurantApi } from './api.js';
import { isAuthenticated, logout } from './auth.js';
import { showToast } from './toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Coming soon logic
    document.querySelectorAll('.coming-soon').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const msg = el.getAttribute('data-message') || 'Coming soon';
            showToast(msg, 'info');
        });
    });
    // Auth UI
    const authSection = document.getElementById('authSection');
    if (authSection) {
        if (isAuthenticated()) {
            authSection.innerHTML = `
                <a class="text-on-surface-variant hover:text-primary transition-colors font-label-bold text-label-bold px-2 py-1 flex items-center gap-1" href="/profile-settings.html"><span class="material-symbols-outlined text-sm">person</span> Profile</a>
                <a class="text-on-surface-variant hover:text-primary transition-colors font-label-bold text-label-bold px-2 py-1 flex items-center gap-1" href="/cart.html"><span class="material-symbols-outlined text-sm">shopping_cart</span> Cart</a>
                <button id="logoutBtn" class="text-on-surface-variant hover:text-primary transition-colors font-label-bold text-label-bold px-2 py-1 flex items-center gap-1"><span class="material-symbols-outlined text-sm">logout</span> Logout</button>
            `;
            document.getElementById('logoutBtn')?.addEventListener('click', () => {
                logout();
                window.location.reload();
            });
        }
    }

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const grid = document.getElementById('restaurantsGrid');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');

    searchBtn?.addEventListener('click', () => loadRestaurants(searchInput?.value));
    searchInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') loadRestaurants(searchInput.value); });

    async function loadRestaurants(query = '') {
        if (grid) grid.innerHTML = '';
        loadingState?.classList.remove('hidden');
        errorState?.classList.add('hidden');
        emptyState?.classList.add('hidden');

        try {
            const params = { skip: 0, limit: 50 };
            if (query) params.query = query;

            const { data } = await restaurantApi.list(params);
            loadingState?.classList.add('hidden');

            if (data && data.items && data.items.length > 0) {
                grid.innerHTML = data.items.map(r => `
                    <a href="/restaurant.html?id=${encodeURIComponent(r.slug)}" class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-surface-container-high group cursor-pointer block ${!r.is_open ? 'opacity-75 grayscale-[20%]' : ''}">
                        <div class="relative h-48 w-full">
                            ${r.cover_image_url ? 
                                `<img alt="${escapeHtml(r.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src="${escapeHtml(r.cover_image_url)}"/>` :
                                `<div class="w-full h-full bg-surface-container-high flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-surface-dim">restaurant</span></div>`
                            }
                            ${!r.is_open ? `
                                <div class="absolute inset-0 bg-surface-dark/40 flex items-center justify-center backdrop-blur-[1px]">
                                    <span class="bg-surface-dark text-white font-label-bold text-label-bold px-3 py-1.5 rounded uppercase tracking-wider">Currently Closed</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="p-card-padding">
                            <div class="flex justify-between items-start mb-1">
                                <h3 class="font-headline-md text-headline-md font-bold text-on-surface truncate">${escapeHtml(r.name)}</h3>
                                <div class="flex items-center bg-tertiary-container text-white px-1.5 py-0.5 rounded text-xs font-bold gap-0.5">
                                    ${r.rating ? r.rating.toFixed(1) : 'NEW'} <span class="material-symbols-outlined text-[10px]" style="font-variation-settings: 'FILL' 1;">star</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm mb-2">
                                <span class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">schedule</span> 30-45 mins</span>
                                <span>•</span>
                                <span>₹${r.minimum_order_amount || 300} for two</span>
                            </div>
                            <p class="font-body-sm text-body-sm text-secondary truncate">${r.categories ? r.categories.map(c => escapeHtml(c.name)).join(', ') : ''}</p>
                            ${r.free_delivery_above ? `
                            <div class="mt-2 pt-2 border-t border-surface-container-high flex items-center gap-1 text-xs text-status-warning font-medium">
                                <span class="material-symbols-outlined text-sm">local_shipping</span> FREE DELIVERY
                            </div>` : ''}
                        </div>
                    </a>
                `).join('');
            } else {
                if (emptyState) {
                    emptyState.innerHTML = `
                        <span class="material-symbols-outlined text-4xl text-on-surface-variant mb-2">search_off</span>
                        <p class="font-body-md text-body-md text-on-surface-variant">No restaurants matched "${escapeHtml(query)}".</p>
                        <p class="font-body-sm text-body-sm text-secondary mt-1">Try another search term.</p>
                    `;
                    emptyState.classList.remove('hidden');
                }
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
