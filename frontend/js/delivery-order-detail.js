import { requireRole } from './auth.js';
import { deliveryOrderApi } from './api.js';
import { showToast } from './toast.js';

requireRole('delivery_partner');

let currentOrder = null;
let orderId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    orderId = params.get('id');

    if (!orderId) {
        window.location.href = '/delivery-dashboard.html';
        return;
    }

    await loadOrder();
});

async function loadOrder() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const orderContent = document.getElementById('orderContent');

    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    orderContent.classList.add('hidden');

    try {
        // There isn't a direct "get delivery order" API currently in orders.py,
        // Wait, the API only has list, accept, reject, pickup, in-transit, deliver!
        // To get details of a specific order, we might need to list and find it.
        // Let's call list() and filter, since we don't have a single GET endpoint.
        const response = await deliveryOrderApi.list({ page: 1, page_size: 100 });
        const orders = response.data.items || [];
        
        currentOrder = orders.find(o => o.id === orderId);

        if (!currentOrder) {
            throw new Error('Order not found');
        }

        renderOrder(currentOrder);

        loadingState.classList.add('hidden');
        orderContent.classList.remove('hidden');
    } catch (error) {
        loadingState.classList.add('hidden');
        errorState.classList.remove('hidden');
    }
}

function renderOrder(order) {
    document.getElementById('displayOrderId').textContent = `Order #${order.id.split('-')[0].toUpperCase()}`;
    document.getElementById('displayTime').textContent = `Placed: ${new Date(order.created_at).toLocaleString()}`;
    
    // Status
    const statusBadge = document.getElementById('displayStatus');
    let statusClass = 'bg-gray-200 text-gray-800';
    let displayStatus = order.status;
    
    if (order.status === 'rider_assigned') {
        statusClass = 'bg-blue-100 text-blue-800';
    } else if (order.status === 'picked_up') {
        statusClass = 'bg-indigo-100 text-indigo-800';
    } else if (order.status === 'in_transit') {
        statusClass = 'bg-brand/10 text-brand-dark';
    } else if (order.status === 'delivered') {
        statusClass = 'bg-green-100 text-green-800';
    }
    
    statusBadge.className = `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusClass}`;
    statusBadge.textContent = displayStatus.toUpperCase().replace('_', ' ');

    // Restaurant details (Pickup)
    document.getElementById('pickupName').textContent = order.restaurant?.name || 'Restaurant';
    const r = order.restaurant;
    document.getElementById('pickupAddress').textContent = r 
        ? `${r.address}, ${r.city}, ${r.state} ${r.postal_code || ''}` 
        : 'Address not available';
    document.getElementById('pickupPhone').textContent = `📞 ${r?.phone || 'N/A'}`;

    // Customer details (Dropoff)
    document.getElementById('dropoffName').textContent = order.customer?.first_name 
        ? `${order.customer.first_name} ${order.customer.last_name || ''}` 
        : 'Customer';
    const custAddress = order.delivery_address;
    document.getElementById('dropoffAddress').textContent = custAddress 
        ? `${custAddress.address_line1}, ${custAddress.city}, ${custAddress.state} ${custAddress.postal_code || ''}` 
        : 'Address not available';
    document.getElementById('dropoffPhone').textContent = `📞 ${order.customer?.phone || 'N/A'}`;

    // Earnings
    const earningsEl = document.getElementById('estimatedEarning');
    if (earningsEl) {
        earningsEl.textContent = `Estimated Earning: ₹${parseFloat(order.delivery_earning || 0).toFixed(2)}`;
    }

    // Items
    const itemsContainer = document.getElementById('itemsContainer');
    itemsContainer.innerHTML = '';
    let grandTotal = 0;
    (order.items || []).forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'py-2 flex justify-between';
        itemEl.innerHTML = `
            <div>
                <p class="text-sm font-semibold text-gray-800">${item.quantity}x ${item.item_name || 'Item'}</p>
            </div>
            <p class="text-sm font-medium text-gray-900">₹${parseFloat(item.total_price).toFixed(2)}</p>
        `;
        grandTotal += parseFloat(item.total_price);
        itemsContainer.appendChild(itemEl);
    });
    
    const totalEl = document.getElementById('grandTotal');
    if (totalEl) totalEl.textContent = `₹${grandTotal.toFixed(2)}`;

    renderActionButtons(order);
}

function renderActionButtons(order) {
    const container = document.getElementById('actionButtons');
    container.innerHTML = ''; // clear existing
    
    const status = order.status;
    const accepted = !!order.rider_accepted_at;
    
    if (status === 'rider_assigned') {
        if (!accepted) {
            container.innerHTML = `
                <button id="btnAccept" class="flex-1 bg-brand text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-dark transition-colors">
                    Accept Delivery
                </button>
                <button id="btnReject" class="flex-1 bg-red-100 text-red-700 font-semibold py-3 px-4 rounded-lg hover:bg-red-200 transition-colors">
                    Reject
                </button>
            `;
            document.getElementById('btnAccept').addEventListener('click', () => updateStatus('accept'));
            document.getElementById('btnReject').addEventListener('click', () => updateStatus('reject'));
        } else {
            container.innerHTML = `
                <button id="btnPickup" class="w-full bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-600 transition-colors">
                    Picked Up From Restaurant
                </button>
            `;
            document.getElementById('btnPickup').addEventListener('click', () => updateStatus('pickup'));
        }
    } else if (status === 'picked_up') {
        container.innerHTML = `
            <button id="btnTransit" class="w-full bg-brand text-white font-semibold py-3 px-4 rounded-lg hover:bg-brand-dark transition-colors">
                Start Navigation / In Transit
            </button>
        `;
        document.getElementById('btnTransit').addEventListener('click', () => updateStatus('inTransit'));
    } else if (status === 'in_transit') {
        container.innerHTML = `
            <button id="btnDeliver" class="w-full bg-green-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors">
                Mark as Delivered
            </button>
        `;
        document.getElementById('btnDeliver').addEventListener('click', () => updateStatus('deliver'));
    } else if (status === 'delivered') {
        container.innerHTML = `
            <div class="w-full bg-green-50 text-green-700 font-semibold py-3 px-4 rounded-lg text-center flex items-center justify-center gap-2">
                <span class="material-symbols-outlined">check_circle</span> Delivered Successfully
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="w-full bg-gray-50 text-gray-500 font-medium py-3 px-4 rounded-lg text-center">
                No actions available for current status
            </div>
        `;
    }
}

async function updateStatus(action) {
    try {
        let res;
        switch (action) {
            case 'accept': res = await deliveryOrderApi.accept(orderId); break;
            case 'reject': 
                await deliveryOrderApi.reject(orderId); 
                window.location.href = '/delivery-dashboard.html';
                return;
            case 'pickup': res = await deliveryOrderApi.pickup(orderId); break;
            case 'inTransit': res = await deliveryOrderApi.inTransit(orderId); break;
            case 'deliver': res = await deliveryOrderApi.deliver(orderId); break;
        }
        
        currentOrder = res.data;
        renderOrder(currentOrder);
        showToast('Order updated successfully', 'success');
    } catch (error) {
        showToast(error.response?.data?.detail || 'Failed to update order', 'error');
    }
}
