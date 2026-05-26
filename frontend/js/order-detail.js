import { customerOrderApi } from './api.js';
import { isAuthenticated, logout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        window.location.href = '/order-history.html';
        return;
    }

    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const orderContent = document.getElementById('orderContent');
    const cancelOrderBtn = document.getElementById('cancelOrderBtn');

    async function loadOrder() {
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        orderContent.classList.add('hidden');

        try {
            const res = await customerOrderApi.get(orderId);
            const order = res.data;

            loadingState.classList.add('hidden');
            orderContent.classList.remove('hidden');

            document.getElementById('displayOrderId').textContent = order.id;
            document.getElementById('displayRestaurantName').textContent = order.restaurant?.name || 'Restaurant';
            document.getElementById('displayOrderDate').textContent = new Date(order.created_at).toLocaleString();
            
            let statusColor = 'text-on-surface-variant bg-surface-container-high';
            if (order.status === 'placed' || order.status === 'accepted' || order.status === 'preparing') {
                statusColor = 'text-blue-800 bg-blue-100';
            } else if (order.status === 'ready_for_pickup' || order.status === 'rider_assigned' || order.status === 'picked_up' || order.status === 'in_transit') {
                statusColor = 'text-indigo-800 bg-indigo-100';
            } else if (order.status === 'delivered') {
                statusColor = 'text-green-800 bg-green-100';
            } else if (order.status === 'cancelled' || order.status === 'rejected' || order.status === 'payment_failed') {
                statusColor = 'text-red-800 bg-red-100';
            }
            
            const statusEl = document.getElementById('displayStatus');
            statusEl.textContent = order.status.replace(/_/g, ' ');
            statusEl.className = `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColor}`;

            if (order.status === 'pending' || order.status === 'awaiting_payment' || order.status === 'placed') {
                cancelOrderBtn.classList.remove('hidden');
            } else {
                cancelOrderBtn.classList.add('hidden');
            }

            document.getElementById('displaySubtotal').textContent = `₹${(order.total_amount - order.delivery_fee - order.tax_amount).toFixed(2)}`;
            document.getElementById('displayDelivery').textContent = `₹${order.delivery_fee.toFixed(2)}`;
            document.getElementById('displayTax').textContent = `₹${order.tax_amount.toFixed(2)}`;
            document.getElementById('displayTotal').textContent = `₹${order.total_amount.toFixed(2)}`;

            if (order.delivery_address) {
                const a = order.delivery_address;
                document.getElementById('displayAddress').innerHTML = `
                    <strong>${escapeHtml(a.label || 'Home')}</strong><br>
                    ${escapeHtml(a.street_address)}<br>
                    ${escapeHtml(a.city)}, ${escapeHtml(a.state)} - ${escapeHtml(a.postal_code)}
                `;
            }

            const itemsContainer = document.getElementById('itemsContainer');
            let itemsHtml = '';
            order.items.forEach(item => {
                const vegIcon = item.is_veg 
                    ? `<div aria-label="Vegetarian" class="veg-icon"><div class="veg-dot"></div></div>`
                    : `<div aria-label="Non-Vegetarian" class="non-veg-icon"><div class="non-veg-triangle"></div></div>`;
                
                itemsHtml += `
                    <div class="p-4 flex justify-between items-center bg-surface-container-lowest">
                        <div class="flex items-center gap-3">
                            ${vegIcon}
                            <div>
                                <h4 class="font-semibold text-sm">${escapeHtml(item.name)}</h4>
                                <p class="text-xs text-on-surface-variant">${item.quantity} x ₹${item.price.toFixed(2)}</p>
                            </div>
                        </div>
                        <span class="font-semibold">₹${item.item_subtotal.toFixed(2)}</span>
                    </div>
                `;
            });
            itemsContainer.innerHTML = itemsHtml;

        } catch (err) {
            console.error(err);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
        }
    }

    cancelOrderBtn.addEventListener('click', async () => {
        if (!confirm("Are you sure you want to cancel this order?")) return;

        try {
            cancelOrderBtn.disabled = true;
            cancelOrderBtn.textContent = 'Cancelling...';
            await customerOrderApi.cancel(orderId);
            await loadOrder();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || "Failed to cancel order");
            cancelOrderBtn.disabled = false;
            cancelOrderBtn.textContent = 'Cancel Order';
        }
    });

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    await loadOrder();
});
