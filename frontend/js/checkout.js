import { cartApi, userApi, customerOrderApi } from './api.js';
import { isAuthenticated, logout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    if (!isAuthenticated()) {
        window.location.href = '/login.html?redirect=/checkout.html';
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
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    let currentCart = null;
    let selectedAddressId = null;

    async function loadAddresses() {
        const addressContainer = document.getElementById('addressListContainer');
        try {
            const response = await userApi.addresses();
            const addresses = Array.isArray(response.data) ? response.data : response;
            
            if (!addresses || addresses.length === 0) {
                addressContainer.innerHTML = `
                    <div class="text-center py-4">
                        <p class="text-on-surface-variant text-sm mb-3">No delivery addresses found.</p>
                        <a href="/address-management.html" class="bg-primary text-white text-xs font-semibold px-4 py-2 rounded">Add Address</a>
                    </div>
                `;
                return;
            }

            let addressHtml = '<div class="space-y-3">';
            addresses.forEach((addr, idx) => {
                const isChecked = idx === 0 ? 'checked' : '';
                if (idx === 0) selectedAddressId = addr.id; // default to first

                addressHtml += `
                    <label class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-surface-bright transition-colors ${isChecked ? 'border-primary bg-surface-bright' : 'border-gray-200'}">
                        <input type="radio" name="address" value="${addr.id}" class="mt-1 text-primary focus:ring-primary" ${isChecked} onchange="window.selectAddress('${addr.id}', this.parentElement)">
                        <div class="flex flex-col">
                            <span class="font-semibold text-sm">${escapeHtml(addr.label || 'Address')}</span>
                            <span class="text-sm text-on-surface-variant">${escapeHtml(addr.street_address)}, ${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} - ${escapeHtml(addr.postal_code)}</span>
                        </div>
                    </label>
                `;
            });
            addressHtml += '</div>';
            addressContainer.innerHTML = addressHtml;

        } catch (err) {
            console.error(err);
            addressContainer.innerHTML = `<p class="text-error text-sm">Failed to load addresses.</p>`;
        }
    }

    window.selectAddress = (id, labelElement) => {
        selectedAddressId = id;
        document.querySelectorAll('input[name="address"]').forEach(input => {
            const parent = input.parentElement;
            parent.classList.remove('border-primary', 'bg-surface-bright');
            parent.classList.add('border-gray-200');
        });
        labelElement.classList.add('border-primary', 'bg-surface-bright');
        labelElement.classList.remove('border-gray-200');
    };

    async function loadCart() {
        loadingState.classList.remove('hidden');
        mainContent.classList.add('hidden');
        emptyState.classList.add('hidden');

        try {
            const { data: cart } = await cartApi.getCart();
            currentCart = cart;
            
            if (!cart || cart.items.length === 0) {
                loadingState.classList.add('hidden');
                emptyState.classList.remove('hidden');
                return;
            }

            // Render Cart Summary
            const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
            set('cartItemCount', cart.items.length);
            set('subtotal', `₹${cart.subtotal}`);
            set('deliveryFee', cart.delivery_fee > 0 ? `₹${cart.delivery_fee}` : 'Free');
            set('taxAmount', `₹${cart.tax_amount}`);
            set('grandTotal', `₹${cart.grand_total}`);
            set('checkoutBtnTotal', `₹${cart.grand_total}`);
            
            const container = document.getElementById('cartItemsContainer');
            let itemsHtml = '';
            
            cart.items.forEach(item => {
                const vegIcon = item.is_veg 
                    ? `<div aria-label="Vegetarian" class="veg-icon"><div class="veg-dot"></div></div>`
                    : `<div aria-label="Non-Vegetarian" class="non-veg-icon"><div class="non-veg-triangle"></div></div>`;
                
                itemsHtml += `
                    <div class="p-4 border-b border-surface-container-highest flex gap-4 items-center">
                        ${vegIcon}
                        <div class="flex-grow flex justify-between items-center">
                            <span class="font-body-sm text-body-md font-semibold">${item.quantity} x ${escapeHtml(item.name)}</span>
                            <span class="font-price-display text-sm font-semibold">₹${item.item_subtotal}</span>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = itemsHtml;
            
            await loadAddresses();

            loadingState.classList.add('hidden');
            mainContent.classList.remove('hidden');

        } catch (err) {
            console.error(err);
            alert("Failed to load checkout. Please try again.");
            loadingState.classList.add('hidden');
        }
    }

    checkoutBtn?.addEventListener('click', async () => {
        if (!selectedAddressId) {
            alert("Please select a delivery address.");
            return;
        }

        const notes = document.getElementById('orderNotes')?.value || '';
        
        try {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = "Placing Order...";
            checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');

            const payload = {
                delivery_address_id: selectedAddressId,
                notes: notes
            };

            const order = await customerOrderApi.create(payload);
            
            // Clear UI cart implicitly since order placed
            // Redirect to payment
            window.location.href = `/payment.html?id=${order.data.id}`;

        } catch (err) {
            console.error(err);
            checkoutBtn.disabled = false;
            checkoutBtn.innerHTML = `
                <div class="flex flex-col items-start">
                    <span class="text-[14px] font-bold" id="checkoutBtnTotal">₹${currentCart?.grand_total || 0}</span>
                    <span class="text-[10px] opacity-80 uppercase tracking-wider">Total</span>
                </div>
                <div class="flex items-center gap-2">
                    <span>Try Again</span>
                    <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                </div>
            `;
            checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            alert(getErrorMessage(err));
        }
    });

    function getErrorMessage(err) {
        if (!err.response || !err.response.data) return err.message || "Failed to place order.";
        const data = err.response.data;
        if (data.error && data.error.message) return data.error.message;
        if (data.detail && Array.isArray(data.detail)) return data.detail.map(d => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join('\n');
        if (typeof data.detail === 'string') return data.detail;
        return "Failed to place order.";
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    await loadCart();
});
