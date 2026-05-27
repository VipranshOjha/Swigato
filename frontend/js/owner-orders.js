import { ownerOrderApi, ownerApi } from './api.js';
import { isAuthenticated, logout, getUserProfile, hasRole } from './auth.js';
import { showToast } from './toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html?redirect=/owner-orders.html';
        return;
    }

    const user = getUserProfile();
    if (!hasRole('restaurant_owner', 'admin', 'super_admin')) {
        window.location.href = '/';
        return;
    }

    document.getElementById('ownerName').textContent = user.full_name || `Owner #${user.sub}`;
    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout();
        window.location.href = '/login.html';
    });

    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    const ordersGrid = document.getElementById('ordersGrid');
    const restaurantFilter = document.getElementById('restaurantFilter');

    let allOrders = [];
    let myRestaurants = [];

    async function init() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const preselectedId = urlParams.get('id');

            const res = await ownerApi.list();
            myRestaurants = Array.isArray(res.data) ? res.data : (res.data.items || []);
            
            myRestaurants.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = r.name;
                if (preselectedId && String(r.id) === String(preselectedId)) {
                    opt.selected = true;
                }
                restaurantFilter.appendChild(opt);
            });

            restaurantFilter.addEventListener('change', renderOrders);
            
            await loadOrders();
            // simple polling for new orders
            setInterval(loadOrders, 10000); 
        } catch (err) {
            console.error(err);
            showError();
        }
    }

    async function loadOrders() {
        try {
            const res = await ownerOrderApi.list({ page: 1, page_size: 100 });
            const allFetchedOrders = res.data.items || [];
            
            // Filter to only active statuses for the live dashboard
            const activeStatuses = ['placed', 'accepted', 'preparing', 'ready_for_pickup', 'rider_assigned', 'picked_up', 'in_transit'];
            allOrders = allFetchedOrders.filter(o => activeStatuses.includes(o.status));
            
            loadingState.classList.add('hidden');
            renderOrders();
        } catch (err) {
            console.error(err);
            loadingState.classList.add('hidden');
            showError();
        }
    }

    function renderOrders() {
        ordersGrid.innerHTML = '';
        errorState.classList.add('hidden');

        const filterId = restaurantFilter.value;
        let filtered = allOrders;
        if (filterId) {
            filtered = allOrders.filter(o => String(o.restaurant_id) === String(filterId));
        }

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
            return;
        }

        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');

        filtered.forEach(order => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col';
            
            const restName = myRestaurants.find(r => String(r.id) === String(order.restaurant_id))?.name || 'Restaurant';
            const date = new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            let actionHtml = '';
            if (order.status === 'placed') {
                actionHtml = `
                    <button class="flex-1 bg-brand text-white font-semibold py-2 rounded shadow hover:bg-brand-dark transition" onclick="window.updateOrderStatus('${order.id}', 'accepted')">Accept</button>
                    <button class="flex-1 bg-red-100 text-red-700 font-semibold py-2 rounded hover:bg-red-200 transition" onclick="window.updateOrderStatus('${order.id}', 'rejected')">Reject</button>
                `;
            } else if (order.status === 'accepted') {
                actionHtml = `
                    <button class="w-full bg-blue-600 text-white font-semibold py-2 rounded shadow hover:bg-blue-700 transition" onclick="window.updateOrderStatus('${order.id}', 'preparing')">Start Preparing</button>
                `;
            } else if (order.status === 'preparing') {
                actionHtml = `
                    <button class="w-full bg-indigo-600 text-white font-semibold py-2 rounded shadow hover:bg-indigo-700 transition" onclick="window.updateOrderStatus('${order.id}', 'ready_for_pickup')">Mark Ready</button>
                `;
            } else if (order.status === 'ready_for_pickup') {
                actionHtml = `
                    <button class="w-full bg-green-600 text-white font-semibold py-2 rounded shadow hover:bg-green-700 transition" onclick="window.updateOrderStatus('${order.id}', 'rider_assigned')">Assign Rider</button>
                `;
            }

            let itemsList = order.items.map(i => `<div class="text-sm flex justify-between"><span class="font-medium">${i.quantity}x ${escapeHtml(i.item_name)}</span><span class="text-gray-500">₹${i.total_price}</span></div>`).join('');

            card.innerHTML = `
                <div class="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <div class="text-xs font-bold text-brand uppercase tracking-wider mb-1">${restName}</div>
                        <div class="text-sm font-semibold text-gray-900">#${order.id.substring(0,8)}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-gray-500 mb-1">${date}</div>
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-200 text-gray-700">${order.status.replace(/_/g, ' ')}</span>
                    </div>
                </div>
                <div class="p-4 flex-grow flex flex-col gap-2">
                    ${itemsList}
                    <div class="border-t border-dashed border-gray-200 mt-2 pt-2 flex justify-between items-center font-bold text-gray-900">
                        <span>Total</span>
                        <span>₹${order.total_amount}</span>
                    </div>
                </div>
                <div class="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                    ${actionHtml}
                </div>
            `;
            
            ordersGrid.appendChild(card);
        });
    }

    window.updateOrderStatus = async (orderId, newStatus) => {
        try {
            await ownerOrderApi.updateStatus(orderId, newStatus);
            showToast(`Order status updated to ${newStatus}`, 'success');
            await loadOrders();
        } catch (err) {
            console.error(err);
            let msg = 'Failed to update order status';
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
            showToast(msg, 'error');
        }
    };

    function showError() {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
        errorState.classList.remove('hidden');
        errorState.classList.add('flex');
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    init();
});
