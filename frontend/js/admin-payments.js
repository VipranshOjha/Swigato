import { adminPaymentApi } from './api.js';
import { isAuthenticated, logout, getUser } from './auth.js';
import { showToast } from './toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html?redirect=/admin-payments.html';
        return;
    }

    const user = getUser();
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
        window.location.href = '/';
        return;
    }

    document.getElementById('adminName').textContent = user.full_name;
    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout();
        window.location.href = '/login.html';
    });

    const statusFilter = document.getElementById('statusFilter');
    const tableBody = document.getElementById('paymentsTableBody');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const paginationInfo = document.getElementById('paginationInfo');

    let currentPage = 1;
    let totalPages = 1;

    async function loadPayments() {
        try {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-500">Loading payments...</td></tr>`;
            
            const status = statusFilter.value;
            const params = {
                page: currentPage,
                page_size: 20
            };
            if (status) params.status = status;

            const res = await adminPaymentApi.list(params);
            const data = res.data;
            
            totalPages = data.pages;
            
            renderPayments(data.items);
            updatePaginationInfo(data.total);
            
        } catch (err) {
            console.error(err);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-red-500">Failed to load payments.</td></tr>`;
            showToast("Failed to load payments", "error");
        }
    }

    function renderPayments(payments) {
        if (!payments || payments.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-500">No payments found.</td></tr>`;
            return;
        }

        let html = '';
        payments.forEach(p => {
            const date = new Date(p.created_at).toLocaleString();
            
            let statusColor = 'bg-gray-100 text-gray-800';
            if (p.status === 'captured') statusColor = 'bg-green-100 text-green-800';
            else if (p.status === 'failed') statusColor = 'bg-red-100 text-red-800';
            else if (p.status === 'refunded') statusColor = 'bg-purple-100 text-purple-800';
            else if (p.status === 'authorized') statusColor = 'bg-blue-100 text-blue-800';
            else if (p.status === 'processing') statusColor = 'bg-yellow-100 text-yellow-800';

            html += `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${p.order_id}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900 uppercase font-semibold">${p.gateway}</div>
                        <div class="text-xs text-gray-500 font-mono">${p.provider_payment_id || 'N/A'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹${p.amount}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                            ${p.status.toUpperCase()}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900" onclick="alert('Payment details for ${p.id} (Order: ${p.order_id})\\nMethod: ${p.method || 'Unknown'}\\nGateway: ${p.gateway}')">View Details</button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    }

    function updatePaginationInfo(total) {
        paginationInfo.textContent = `Showing page ${currentPage} of ${totalPages} (${total} total)`;
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
    }

    statusFilter.addEventListener('change', () => {
        currentPage = 1;
        loadPayments();
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadPayments();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadPayments();
        }
    });

    loadPayments();
});
