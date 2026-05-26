import { cartApi } from './api.js';
import { isAuthenticated, logout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    if (!isAuthenticated()) {
        window.location.href = '/login.html?redirect=/cart.html';
        return;
    }

    // ── Auth UI ───────────────────────────────────────────────────────────
    const authSection = document.getElementById('authSection');
    if (authSection) {
        authSection.innerHTML = `
            <a class="text-on-surface-variant hover:text-primary transition-colors font-label-bold text-label-bold px-2 py-1 flex items-center gap-1" href="/profile-settings.html"><span class="material-symbols-outlined text-sm">person</span> Profile</a>
            <button id="logoutBtn" class="text-on-surface-variant hover:text-primary transition-colors font-label-bold text-label-bold px-2 py-1 flex items-center gap-1"><span class="material-symbols-outlined text-sm">logout</span> Logout</button>
        `;
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            logout();
            window.location.href = '/';
        });
    }

    const loadingState = document.getElementById('loadingState');
    const mainContent = document.getElementById('mainContent');
    const emptyState = document.getElementById('emptyState');
    const clearCartBtn = document.getElementById('clearCartBtn');

    clearCartBtn?.addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear your cart?")) {
            try {
                await cartApi.clearCart();
                loadCart();
            } catch (err) {
                alert("Failed to clear cart");
            }
        }
    });

    // Expose functions globally for inline onclick handlers
    window.updateQuantity = async (itemId, currentQty, delta) => {
        const newQty = currentQty + delta;
        if (newQty <= 0) {
            await window.removeItem(itemId);
            return;
        }
        if (newQty > 20) {
            alert("Maximum quantity is 20");
            return;
        }
        try {
            await cartApi.updateItemQuantity(itemId, newQty);
            loadCart();
        } catch (err) {
            let msg = 'Failed to update quantity';
            const detail = err.response?.data?.detail;
            if (detail) {
                if (Array.isArray(detail)) {
                    msg = detail.map(d => `${d.loc.slice(-1)}: ${d.msg}`).join('\n');
                } else {
                    msg = detail;
                }
            }
            alert(msg);
        }
    };

    window.removeItem = async (itemId) => {
        try {
            await cartApi.removeItem(itemId);
            loadCart();
        } catch (err) {
            alert("Failed to remove item");
        }
    };

    async function loadCart() {
        loadingState.classList.remove('hidden');
        mainContent.classList.add('hidden');
        emptyState.classList.add('hidden');

        try {
            const { data: cart } = await cartApi.getCart();
            
            if (!cart || cart.items.length === 0) {
                loadingState.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }

            // Render Cart
            const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
            set('restaurantName', cart.restaurant_name ? cart.restaurant_name : 'Your Cart');
            set('cartItemCount', cart.items.length);
            set('subtotal', `₹${cart.subtotal}`);
            set('deliveryFee', cart.delivery_fee > 0 ? `₹${cart.delivery_fee}` : 'Free');
            set('taxAmount', `₹${cart.tax_amount}`);
            set('grandTotal', `₹${cart.grand_total}`);
            set('checkoutBtnTotal', `₹${cart.grand_total}`);
            
            clearCartBtn.classList.remove('hidden');
            const addMoreItemsBtn = document.getElementById('addMoreItemsBtn');
            if (addMoreItemsBtn && cart.restaurant_id) {
                addMoreItemsBtn.classList.remove('hidden');
                addMoreItemsBtn.onclick = () => {
                    window.location.href = `/restaurant.html?id=${cart.restaurant_id}`;
                };
            }

            const container = document.getElementById('cartItemsContainer');
            let itemsHtml = '';
            
            cart.items.forEach(item => {
                const vegIcon = item.is_veg 
                    ? `<div aria-label="Vegetarian" class="veg-icon"><div class="veg-dot"></div></div>`
                    : `<div aria-label="Non-Vegetarian" class="non-veg-icon"><div class="non-veg-triangle"></div></div>`;
                
                itemsHtml += `
                    <div class="p-4 border-b border-surface-container-highest flex gap-4 items-start hover:bg-surface-bright transition-colors">
                        ${item.image_url ? 
                            `<img alt="${escapeHtml(item.name)}" class="w-[60px] h-[60px] rounded object-cover shadow-sm" src="${escapeHtml(item.image_url)}"/>` :
                            `<div class="w-[60px] h-[60px] rounded bg-surface-container-high flex items-center justify-center shadow-sm">
                                <span class="material-symbols-outlined text-secondary text-2xl">local_dining</span>
                            </div>`
                        }
                        <div class="flex-grow">
                            <div class="flex justify-between items-start mb-1">
                                <div class="flex items-center gap-2">
                                    ${vegIcon}
                                    <h3 class="font-body-lg text-body-lg font-semibold m-0">${escapeHtml(item.name)}</h3>
                                </div>
                                <span class="font-price-display text-price-display">₹${item.item_subtotal}</span>
                            </div>
                            <p class="font-body-sm text-body-sm text-on-surface-variant mb-3 text-[10px] opacity-70">₹${item.price} each</p>
                            <div class="flex items-center justify-between">
                                <button onclick="removeItem('${item.menu_item_id}')" class="text-error font-label-bold text-label-bold hover:underline">REMOVE</button>
                                <div class="flex items-center border border-outline-variant rounded bg-surface-container-lowest overflow-hidden">
                                    <button aria-label="Decrease quantity" onclick="updateQuantity('${item.menu_item_id}', ${item.quantity}, -1)" class="qty-btn hover:bg-surface-container-low transition-colors">-</button>
                                    <span class="w-8 text-center font-body-md text-body-md font-semibold">${item.quantity}</span>
                                    <button aria-label="Increase quantity" onclick="updateQuantity('${item.menu_item_id}', ${item.quantity}, 1)" class="qty-btn hover:bg-surface-container-low transition-colors">+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = itemsHtml;
            
            loadingState.classList.add('hidden');
            mainContent.classList.remove('hidden');

            document.getElementById('checkoutBtn')?.addEventListener('click', () => {
                window.location.href = '/checkout.html';
            });

        } catch (err) {
            console.error(err);
            alert("Failed to load cart. Please try again.");
            loadingState.classList.add('hidden');
        }
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    // Initial Load
    await loadCart();
});
