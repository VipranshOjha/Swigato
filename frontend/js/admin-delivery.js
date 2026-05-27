import { adminDeliveryApi } from './api.js';
import { requireRole, logout, getUserProfile } from './auth.js';
import { showToast } from './toast.js';

requireRole('admin', 'super_admin');

let currentPage = 1;
const pageSize = 20;

document.addEventListener('DOMContentLoaded', () => {
    const user = getUserProfile();
    document.getElementById('adminName').textContent = user.full_name || 'Admin';
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    document.getElementById('filterVerified').addEventListener('change', () => {
        currentPage = 1;
        loadPartners();
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadPartners();
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        currentPage++;
        loadPartners();
    });

    loadPartners();
});

async function loadPartners() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.getElementById('tableContainer');
    const partnersList = document.getElementById('partnersList');

    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    tableContainer.classList.add('hidden');

    try {
        const verifiedFilter = document.getElementById('filterVerified').value;
        const params = { page: currentPage, page_size: pageSize };
        
        if (verifiedFilter !== '') {
            params.is_verified = verifiedFilter === 'true';
        }

        const res = await adminDeliveryApi.list(params);
        const partners = res.data.items || [];
        const total = res.data.total || 0;

        loadingState.classList.add('hidden');

        if (partners.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            tableContainer.classList.remove('hidden');
            renderTable(partners);
            updatePagination(total);
        }
    } catch (error) {
        console.error(error);
        loadingState.classList.add('hidden');
        showToast('Failed to load partners', 'error');
    }
}

function renderTable(partners) {
    const tbody = document.getElementById('partnersList');
    tbody.innerHTML = '';

    partners.forEach(p => {
        const tr = document.createElement('tr');
        
        const verifiedBadge = p.is_verified 
            ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Verified</span>`
            : `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>`;
            
        const suspendedBadge = p.is_suspended
            ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 mt-1">Suspended</span>`
            : '';

        const onlineIndicator = p.is_online
            ? `<div class="flex items-center gap-1 text-green-600 text-sm"><span class="w-2 h-2 rounded-full bg-green-500"></span> Online</div>`
            : `<div class="flex items-center gap-1 text-gray-500 text-sm"><span class="w-2 h-2 rounded-full bg-gray-400"></span> Offline</div>`;

        const availIndicator = (p.is_online && p.is_available)
            ? `<div class="text-xs text-brand mt-1 flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">check</span> Accepting</div>`
            : `<div class="text-xs text-gray-400 mt-1">Not Accepting</div>`;

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 bg-brand/10 rounded-full flex items-center justify-center text-brand font-bold">
                        ${(p.user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${p.user?.name || 'Unknown'}</div>
                        <div class="text-sm text-gray-500">${p.user?.email || ''}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${p.phone || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>${p.vehicle_type}</div>
                <div class="text-xs text-gray-400">${p.vehicle_number}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-col items-start gap-1">
                    ${verifiedBadge}
                    ${suspendedBadge}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${onlineIndicator}
                ${availIndicator}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                ${!p.is_verified 
                    ? `<button class="text-green-600 hover:text-green-900 font-semibold verify-btn" data-id="${p.id}" data-action="true">Verify</button>`
                    : `<button class="text-yellow-600 hover:text-yellow-900 font-semibold verify-btn" data-id="${p.id}" data-action="false">Unverify</button>`
                }
                
                <span class="text-gray-300">|</span>
                
                ${!p.is_suspended
                    ? `<button class="text-red-600 hover:text-red-900 font-semibold suspend-btn" data-id="${p.id}" data-action="true">Suspend</button>`
                    : `<button class="text-gray-600 hover:text-gray-900 font-semibold suspend-btn" data-id="${p.id}" data-action="false">Unsuspend</button>`
                }
            </td>
        `;
        
        tbody.appendChild(tr);
    });

    // Event listeners
    document.querySelectorAll('.verify-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const action = e.target.getAttribute('data-action') === 'true';
            try {
                await adminDeliveryApi.verify(id, action);
                showToast(`Partner ${action ? 'verified' : 'unverified'}`, 'success');
                loadPartners();
            } catch (err) {
                showToast(err.response?.data?.detail || 'Action failed', 'error');
            }
        });
    });

    document.querySelectorAll('.suspend-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const action = e.target.getAttribute('data-action') === 'true';
            try {
                await adminDeliveryApi.suspend(id, action);
                showToast(`Partner ${action ? 'suspended' : 'unsuspended'}`, 'success');
                loadPartners();
            } catch (err) {
                showToast(err.response?.data?.detail || 'Action failed', 'error');
            }
        });
    });
}

function updatePagination(total) {
    const totalPages = Math.ceil(total / pageSize) || 1;
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}
