import { requireRole, getUserProfile, logout } from './auth.js';
import { deliveryApi, deliveryOrderApi } from './api.js';
import { showToast } from './toast.js';

requireRole('delivery_partner');

let profile = null;

document.addEventListener('DOMContentLoaded', async () => {
    const userNameEl = document.getElementById('userName');
    const userProfile = getUserProfile();
    if (userProfile?.name) userNameEl.textContent = userProfile.name;

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('refreshBtn').addEventListener('click', loadOrders);

    document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
    
    document.getElementById('onlineToggle').addEventListener('change', handleOnlineToggle);

    await loadProfile();
});

async function loadProfile() {
    try {
        const response = await deliveryApi.me();
        profile = response.data;
        showDashboard();
    } catch (error) {
        if (error.response?.status === 404) {
            showRegistration();
        } else {
            showToast('Failed to load profile', 'error');
        }
    }
}

function showRegistration() {
    document.getElementById('registrationSection').classList.remove('hidden');
    document.getElementById('dashboardContent').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('registrationSection').classList.add('hidden');
    document.getElementById('dashboardContent').classList.remove('hidden');
    updateProfileUI();
    loadOrders();
    setInterval(() => loadOrders(false), 15000); // 15s poll
}

async function handleRegistration(e) {
    e.preventDefault();
    const phone = document.getElementById('regPhone').value.trim();
    const vehicleType = document.getElementById('regVehicle').value;

    try {
        const response = await deliveryApi.register({
            phone,
            vehicle_type: vehicleType,
            vehicle_number: 'N/A' // Simpler for now
        });
        profile = response.data;
        showToast('Profile created successfully!', 'success');
        showDashboard();
    } catch (error) {
        showToast(error.response?.data?.detail || 'Failed to register', 'error');
    }
}

function updateProfileUI() {
    if (!profile) return;
    
    const onlineToggle = document.getElementById('onlineToggle');
    const statusText = document.getElementById('profileStatusText');

    onlineToggle.checked = profile.is_online;

    if (profile.is_online) {
        statusText.innerHTML = '<span class="text-green-600 font-semibold flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span> Online & Available</span>';
    } else {
        statusText.innerHTML = '<span class="text-gray-500 font-semibold flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-gray-400"></span> Offline</span>';
    }

    const earningsEl = document.getElementById('totalEarnings');
    const deliveriesEl = document.getElementById('totalDeliveries');
    if (earningsEl) earningsEl.textContent = `₹${parseFloat(profile.total_earnings || 0).toFixed(2)}`;
    if (deliveriesEl) deliveriesEl.textContent = profile.total_deliveries || 0;
}

async function handleOnlineToggle(e) {
    const isOnline = e.target.checked;
    try {
        const response = await deliveryApi.toggleOnline(isOnline);
        profile = response.data;
        updateProfileUI();
        if (isOnline) {
            showToast('You are now online', 'success');
        } else {
            showToast('You are now offline', 'info');
        }
    } catch (error) {
        e.target.checked = !isOnline; // Revert
        showToast('Failed to update status', 'error');
    }
}


async function loadOrders(showLoader = true) {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const ordersList = document.getElementById('ordersList');
    const countBadge = document.getElementById('deliveryCount');

    if (showLoader) {
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
    }
    // ALWAYS clear the list before appending to prevent duplicate renders during polling
    ordersList.innerHTML = '';

    try {
        const response = await deliveryOrderApi.list({ page: 1, page_size: 50 });
        const orders = response.data.items || [];
        
        countBadge.textContent = orders.length;
        loadingState.classList.add('hidden');

        if (orders.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        orders.forEach(order => {
            const el = createOrderElement(order);
            ordersList.appendChild(el);
        });

    } catch (error) {
        loadingState.classList.add('hidden');
        showToast('Failed to load orders', 'error');
    }
}

function createOrderElement(order) {
    const div = document.createElement('div');
    div.className = 'bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4';
    
    // Status formatting
    let statusClass = 'bg-gray-100 text-gray-700';
    let displayStatus = order.status.toUpperCase();
    const accepted = !!order.rider_accepted_at;
    
    if (order.status === 'rider_assigned') {
        if (!accepted) {
            statusClass = 'bg-red-100 text-red-700';
            displayStatus = 'Accept / Reject';
        } else {
            statusClass = 'bg-blue-100 text-blue-700';
            displayStatus = 'Action Required';
        }
    } else if (order.status === 'picked_up') {
        statusClass = 'bg-indigo-100 text-indigo-700';
    } else if (order.status === 'in_transit') {
        statusClass = 'bg-brand/10 text-brand-dark';
    } else if (order.status === 'delivered') {
        statusClass = 'bg-green-100 text-green-700';
    }
    
    const address = order.delivery_address 
        ? `${order.delivery_address.street}, ${order.delivery_address.city}`
        : 'Address not available';

    div.innerHTML = `
        <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">#${order.id.split('-')[0].toUpperCase()}</span>
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClass}">${displayStatus.replace('_', ' ')}</span>
            </div>
            <h3 class="font-bold text-gray-900 truncate">${order.restaurant?.name || 'Restaurant'}</h3>
            <p class="text-sm text-gray-500 truncate mt-1 flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">location_on</span> ${address}
            </p>
            <p class="text-sm font-medium text-green-700 mt-1">Earn: ₹${parseFloat(order.delivery_earning || 0).toFixed(2)}</p>
            <p class="text-xs text-gray-400 mt-2">Placed: ${new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div class="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
            <a href="/delivery-order-detail.html?id=${order.id}" class="w-full md:w-auto text-center px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors text-sm">
                View Details
            </a>
        </div>
    `;
    
    return div;
}
