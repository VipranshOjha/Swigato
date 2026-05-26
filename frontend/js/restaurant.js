import { restaurantApi, menuApi, cartApi } from './api.js';
import { isAuthenticated, logout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ── Auth UI ───────────────────────────────────────────────────────────
    const authSection = document.getElementById('authSection');
    if (authSection) {
        if (isAuthenticated()) {
            authSection.innerHTML = `
                <a href="/profile-settings.html" class="text-on-surface-variant dark:text-on-secondary-container hover:text-primary transition-colors duration-200">
                    <span class="material-symbols-outlined" data-icon="person">person</span>
                </a>
                <a href="/cart.html" class="text-on-surface-variant dark:text-on-secondary-container hover:text-primary transition-colors duration-200">
                    <span class="material-symbols-outlined" data-icon="shopping_cart">shopping_cart</span>
                </a>
                <button id="logoutBtn" class="text-on-surface-variant dark:text-on-secondary-container hover:text-primary transition-colors duration-200 ml-2">
                    <span class="material-symbols-outlined" data-icon="logout">logout</span>
                </button>
            `;
            document.getElementById('logoutBtn')?.addEventListener('click', () => {
                logout();
                window.location.reload();
            });
        }
    }

    // ── Get ID from URL ───────────────────────────────────────────────────
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        showError('Invalid restaurant link.');
        return;
    }

    let activeRestaurant = null;

    // ── Load Restaurant Data ──────────────────────────────────────────────
    try {
        const { data: r } = await restaurantApi.get(id);
        activeRestaurant = r;

        document.title = `${r.name} - Swigato`;

        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? ''; };
        set('restaurantName', r.name);
        set('restaurantCategories', `${(r.categories || []).map(c => c.name).join(' • ')} • ${r.city}`);
        set('restaurantRating', r.rating ? r.rating.toFixed(1) : 'NEW');

        if (r.free_delivery_above) {
            const el = document.getElementById('freeDeliveryAbove');
            const txt = document.getElementById('freeDeliveryText');
            if (el && txt) {
                el.classList.remove('hidden');
                txt.textContent = `FREE DELIVERY above ₹${r.free_delivery_above}`;
            }
        }

        if (!r.is_open) {
            const timeContainer = document.getElementById('deliveryTimeContainer');
            if (timeContainer) {
                timeContainer.innerHTML = '<span class="material-symbols-outlined text-[14px]">storefront</span><span class="font-bold tracking-wider uppercase text-xs">Currently Closed</span>';
                timeContainer.classList.replace('bg-surface-dark/50', 'bg-error/90');
            }
        }

        // Cover image
        if (r.cover_image_url) {
            const coverEl = document.getElementById('coverImageContainer');
            if (coverEl) {
                const img = document.createElement('img');
                img.src = escapeHtml(r.cover_image_url);
                img.className = 'w-full h-full object-cover absolute inset-0 z-0';
                coverEl.insertBefore(img, coverEl.firstChild);
            }
        } else {
            const coverEl = document.getElementById('coverImageContainer');
            if (coverEl) {
                const div = document.createElement('div');
                div.className = 'w-full h-full bg-surface-container-high absolute inset-0 z-0 flex items-center justify-center';
                div.innerHTML = '<span class="material-symbols-outlined text-6xl text-surface-dim">restaurant</span>';
                coverEl.insertBefore(div, coverEl.firstChild);
            }
        }

        document.getElementById('loadingState')?.classList.add('hidden');
        document.getElementById('mainContent')?.classList.remove('hidden');
        
        // Fetch Menu
        try {
            const { data: menuData } = await menuApi.getPublicMenu(r.id);
            renderMenu(menuData);
        } catch (menuErr) {
            console.error("Failed to load menu", menuErr);
            const menuEl = document.getElementById('restaurantMenu');
            if (menuEl) menuEl.innerHTML = `<p class="text-on-surface-variant py-6 text-center">Menu not available.</p>`;
        }

    } catch (err) {
        console.error(err);
        showError(err.response?.status === 404
            ? 'Restaurant not found or not yet approved.'
            : 'Failed to load restaurant details.');
    }
    
    function renderMenu(categories) {
        const menuEl = document.getElementById('restaurantMenu');
        const navEl = document.getElementById('categoryNav');
        const navItemsEl = document.getElementById('categoryNavItems');

        if (!menuEl) return;
        
        if (!categories || categories.length === 0) {
            menuEl.innerHTML = `<div class="text-center py-10 rounded-xl bg-surface-container-low"><p class="text-on-surface-variant">Menu not yet published.</p></div>`;
            return;
        }

        if (navEl && navItemsEl) {
            navEl.classList.remove('hidden');
            navItemsEl.innerHTML = categories.map((cat, idx) => `
                <a href="#cat-${cat.id}" class="whitespace-nowrap px-4 py-2 rounded-full ${idx === 0 ? 'bg-primary text-on-primary font-label-bold' : 'border border-outline-variant text-on-surface-variant hover:border-primary'} transition-colors font-label-bold text-label-bold">
                    ${escapeHtml(cat.name)}
                </a>
            `).join('');
        }
        
        let html = '';
        categories.forEach(cat => {
            const itemsList = cat.items || [];
            const itemCount = itemsList.length;
            
            html += `
                <section id="cat-${cat.id}">
                    <h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-6 flex items-center gap-2 mt-8">
                        ${escapeHtml(cat.name)} <span class="font-body-md text-body-md text-secondary ml-2">(${itemCount})</span>
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            `;
            
            if (itemCount > 0) {
                itemsList.forEach(item => {
                    const vegIcon = item.is_veg ? '<div class="veg-icon mb-1" title="Veg"></div>' : '<div class="non-veg-icon mb-1" title="Non-Veg"></div>';

                    html += `
                        <div class="bg-surface-background rounded-xl p-card-padding border border-surface-variant flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div class="flex-grow flex flex-col">
                                ${vegIcon}
                                <h3 class="font-headline-md text-headline-md mb-1">${escapeHtml(item.name)}</h3>
                                ${item.dietary_tags && item.dietary_tags.length > 0 ? `
                                <div class="flex items-center gap-2 text-[10px] text-on-surface-variant/70 mb-1 font-medium">
                                    ${item.dietary_tags.map((tag, idx) => `${idx > 0 ? '<span>|</span>' : ''}<span class="flex items-center gap-1">${escapeHtml(tag)}</span>`).join('')}
                                </div>
                                ` : ''}
                                <p class="font-price-display text-price-display text-primary mb-2">₹${item.price}</p>
                                <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-auto">${escapeHtml(item.description || '')}</p>
                            </div>
                            <div class="relative w-32 h-32 flex-shrink-0">
                                ${item.image_url ? `
                                    <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover rounded-lg">
                                ` : `
                                    <div class="w-full h-full bg-surface-container-high rounded-lg flex items-center justify-center"><span class="material-symbols-outlined text-surface-dim text-3xl">fastfood</span></div>
                                `}
                                <button onclick="addToCart('${item.id}')" class="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-surface text-status-success border border-surface-variant px-4 py-1.5 rounded-lg font-label-bold text-label-bold shadow-sm uppercase tracking-wider w-24 text-center hover:bg-surface-container-low transition-colors">
                                    ADD
                                </button>
                            </div>
                        </div>
                    `;
                });
            } else {
                html += `
                    <div class="col-span-1 md:col-span-2 text-center py-8 text-on-surface-variant bg-surface-container-lowest rounded-xl border border-surface-variant border-dashed">
                        <span class="material-symbols-outlined text-4xl mb-2 opacity-50">restaurant_menu</span>
                        <p class="font-body-md text-body-md">Items in this category are currently unavailable.</p>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </section>
            `;
        });
        
        menuEl.innerHTML = html;
        setupCategoryNav();
    }

    function setupCategoryNav() {
        const navEl = document.getElementById('categoryNav');
        const navItemsEl = document.getElementById('categoryNavItems');
        if (!navEl || !navItemsEl) return;
        
        const navLinks = navItemsEl.querySelectorAll('a');
        const sections = document.querySelectorAll('section[id^="cat-"]');
        
        // Smooth scroll click handler
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    // Offset for sticky header (h-16 = 64px) + nav height (approx 60px)
                    const y = targetEl.getBoundingClientRect().top + window.scrollY - 130;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            });
        });
        
        // Scroll spy
        const onScroll = () => {
            let current = null;
            sections.forEach(sec => {
                const rect = sec.getBoundingClientRect();
                // If top of section is near the header, it's active
                if (rect.top <= 160 && rect.bottom > 160) {
                    current = sec.getAttribute('id');
                }
            });
            
            // Fallbacks
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 10) {
                current = sections[sections.length - 1]?.getAttribute('id');
            }
            if (!current && window.scrollY < 100) {
                current = sections[0]?.getAttribute('id');
            }
            
            if (current) {
                navLinks.forEach(link => {
                    const isActive = link.getAttribute('href') === `#${current}`;
                    
                    if (isActive) {
                        link.className = 'whitespace-nowrap px-4 py-2 rounded-full bg-primary text-on-primary font-label-bold transition-colors text-label-bold';
                        
                        // Center the active chip in the scrollable nav
                        const scrollLeft = link.offsetLeft - navEl.offsetWidth / 2 + link.offsetWidth / 2;
                        navEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                    } else {
                        link.className = 'whitespace-nowrap px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary transition-colors font-label-bold text-label-bold';
                    }
                });
            }
        };
        
        window.addEventListener('scroll', onScroll, { passive: true });
        // Initial trigger
        onScroll();
    }

    function showError(msg) {
        document.getElementById('loadingState')?.classList.add('hidden');
        const errorState = document.getElementById('errorState');
        if (errorState) errorState.classList.remove('hidden');
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

window.addToCart = async (itemId) => {
    // Check if the restaurant is closed
    const urlParams = new URLSearchParams(window.location.search);
    const rId = urlParams.get('id');
    
    try {
        const { data: currentRest } = await restaurantApi.get(rId);
        if (!currentRest.is_open) {
            alert("This restaurant is currently closed and not accepting orders.");
            return;
        }
    } catch (e) {
        console.error("Could not check restaurant status", e);
    }

    try {
        await cartApi.addItem(itemId, 1);
        
        // Show floating cart summary
        const floatingCart = document.getElementById('floatingCartSummary');
        if (floatingCart) floatingCart.classList.remove('hidden');

        // Note: we would fetch the cart to get the correct total, but for UX an alert is annoying.
        // We could use a toast here if we had one.
    } catch (err) {
        if (err.response?.status === 401) {
            window.location.href = `/login.html?redirect=/restaurant.html?id=${new URLSearchParams(window.location.search).get('id')}`;
        } else {
            let msg = 'Failed to add item to cart';
            const data = err.response?.data;
            if (data) {
                if (data.error && data.error.message) msg = data.error.message;
                else if (data.detail) {
                    if (Array.isArray(data.detail)) {
                        msg = data.detail.map(d => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join('\n');
                    } else if (typeof data.detail === 'string') {
                        msg = data.detail;
                    }
                }
            }
            alert(msg);
        }
    }
};
