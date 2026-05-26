import { customerOrderApi } from './api.js';
import { isAuthenticated, logout } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html?redirect=/order-history.html';
        return;
    }

    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    const ordersContainer = document.getElementById('ordersContainer');

    async function loadOrders() {
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        emptyState.classList.add('hidden');
        ordersContainer.innerHTML = '';

        try {
            const res = await customerOrderApi.list({ page: 1, page_size: 50 });
            const orders = res.data.items;

            loadingState.classList.add('hidden');

            if (!orders || orders.length === 0) {
                emptyState.classList.remove('hidden');
                return;
            }

            let html = '';
            orders.forEach(order => {
                const date = new Date(order.created_at).toLocaleString();
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

                html += `
                    <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow cursor-pointer" onclick="window.location.href='/order-detail.html?id=${order.id}'">
                        <div class="flex gap-4 items-start">
                            <div class="w-16 h-16 bg-surface-container-high rounded-lg flex items-center justify-center shrink-0">
                                <span class="material-symbols-outlined text-3xl text-on-surface-variant">restaurant</span>
                            </div>
                            <div>
                                <h3 class="font-bold text-lg mb-1">${escapeHtml(order.restaurant?.name || 'Restaurant')}</h3>
                                <p class="text-xs text-on-surface-variant mb-2">Order ID: <span class="font-mono">${order.id}</span></p>
                                <p class="text-xs text-on-surface-variant mb-2">${date}</p>
                                <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${statusColor}">${order.status.replace(/_/g, ' ')}</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-start md:items-end w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 border-outline-variant/30 pt-4 md:pt-0">
                            <div class="text-xl font-price-display font-extrabold text-primary mb-2">₹${order.total_amount}</div>
                            <button class="px-4 py-2 bg-surface text-primary border border-outline-variant rounded font-semibold text-sm hover:bg-surface-container-high transition-colors w-full md:w-auto text-center">
                                View Details
                            </button>
                        </div>
                    </div>
                `;
            });

            ordersContainer.innerHTML = html;

        } catch (err) {
            console.error(err);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
        }
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    await loadOrders();
});
