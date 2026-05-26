import { adminApi } from './api.js';
import { showToast } from './toast.js';
import { requireRole, logout, getUserProfile } from './auth.js';

// ── Auth Guard ────────────────────────────────────────────────────────────────
if (!requireRole('admin', 'super_admin')) throw new Error('Unauthorized');

document.addEventListener('DOMContentLoaded', async () => {
    // ── Header ────────────────────────────────────────────────────────────
    const user = getUserProfile();
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) adminNameEl.textContent = `Admin #${user?.sub || ''}`;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => logout());

    // ── State ─────────────────────────────────────────────────────────────
    const tableBody = document.getElementById('restaurantsTableBody');
    const statusFilter = document.getElementById('statusFilter');
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const modal = document.getElementById('actionModal');

    let currentPage = 1;
    const pageSize = 20;
    let currentAction = null;
    let currentRestaurantId = null;

    // ── Load Restaurants ──────────────────────────────────────────────────
    async function loadRestaurants() {
        const status = statusFilter?.value || '';
        const params = { page: currentPage, page_size: pageSize };
        if (status) params.status = status;

        tableBody.innerHTML = `
            <tr><td colspan="6" class="px-6 py-8 text-center text-sm text-gray-500">
                <svg class="animate-spin h-5 w-5 text-gray-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>Loading...
            </td></tr>`;

        try {
            const { data } = await adminApi.list(params);
            renderTable(data.items || []);

            if (paginationInfo) {
                paginationInfo.textContent = `Showing ${data.items.length} of ${data.total} restaurants (Page ${data.page}/${data.total_pages})`;
            }
            if (prevBtn) prevBtn.disabled = currentPage <= 1;
            if (nextBtn) nextBtn.disabled = !data.has_next;
        } catch (err) {
            console.error(err);
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-sm text-red-500">Failed to load restaurants. Please try again.</td></tr>`;
        }
    }

    // ── Render Table ──────────────────────────────────────────────────────
    function renderTable(restaurants) {
        if (!restaurants.length) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-sm text-gray-500">No restaurants found for the selected filter.</td></tr>`;
            return;
        }

        tableBody.innerHTML = restaurants.map(r => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                    <div class="text-sm font-semibold text-gray-900">${escapeHtml(r.name)}</div>
                    <div class="text-xs text-gray-400 mt-0.5">${escapeHtml(r.slug)}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-800">${escapeHtml(r.phone)}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(r.email)}</div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                    ${escapeHtml(r.city)}, ${escapeHtml(r.state)}
                </td>
                <td class="px-6 py-4">
                    <span class="px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusClass(r.approval_status)}">
                        ${r.approval_status.replace(/_/g, ' ')}
                    </span>
                </td>
                <td class="px-6 py-4 text-xs text-gray-500">
                    Owner #${r.owner_id}
                </td>
                <td class="px-6 py-4 text-right text-sm font-medium space-x-2">
                    ${getActions(r)}
                </td>
            </tr>
        `).join('');
    }

    function getStatusClass(status) {
        const map = {
            'APPROVED': 'bg-green-100 text-green-800',
            'PENDING_APPROVAL': 'bg-yellow-100 text-yellow-800',
            'REJECTED': 'bg-red-100 text-red-800',
            'SUSPENDED': 'bg-orange-100 text-orange-800',
            'DRAFT': 'bg-gray-100 text-gray-700',
        };
        return map[status] || 'bg-gray-100 text-gray-700';
    }

    function getActions(r) {
        const actions = [];
        if (r.approval_status === 'PENDING_APPROVAL') {
            actions.push(`<button onclick="triggerAction('${r.id}', 'approve')" class="text-green-600 hover:text-green-900 font-medium">Approve</button>`);
            actions.push(`<button onclick="triggerAction('${r.id}', 'reject')" class="text-red-600 hover:text-red-900 font-medium">Reject</button>`);
        }
        if (r.approval_status === 'APPROVED') {
            actions.push(`<button onclick="triggerAction('${r.id}', 'suspend')" class="text-yellow-600 hover:text-yellow-900 font-medium">Suspend</button>`);
        }
        if (r.approval_status === 'SUSPENDED') {
            actions.push(`<button onclick="triggerAction('${r.id}', 'activate')" class="text-green-600 hover:text-green-900 font-medium">Activate</button>`);
        }
        return actions.join(' · ') || '<span class="text-gray-400 text-xs">—</span>';
    }

    // ── Modal ─────────────────────────────────────────────────────────────
    window.triggerAction = (id, action) => {
        currentRestaurantId = id;
        currentAction = action;

        const titles = { approve: 'Approve Restaurant', reject: 'Reject Restaurant', suspend: 'Suspend Restaurant', activate: 'Activate Restaurant' };
        document.getElementById('modalTitle').textContent = titles[action] || action;

        const reasonWrapper = document.getElementById('actionReason')?.parentElement;
        if (reasonWrapper) {
            reasonWrapper.style.display = action === 'reject' ? 'block' : 'none';
        }
        if (document.getElementById('actionReason')) document.getElementById('actionReason').value = '';

        modal?.classList.remove('hidden');
    };

    document.getElementById('cancelActionBtn')?.addEventListener('click', () => {
        modal?.classList.add('hidden');
        currentRestaurantId = null;
        currentAction = null;
    });

    document.getElementById('confirmActionBtn')?.addEventListener('click', async () => {
        const reason = document.getElementById('actionReason')?.value.trim();

        if (currentAction === 'reject' && !reason) {
            showToast('A reason is required for rejection', 'error');
            return;
        }

        const btn = document.getElementById('confirmActionBtn');
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
            if (currentAction === 'approve') {
                await adminApi.approve(currentRestaurantId);
                showToast('Restaurant approved!', 'success');
            } else if (currentAction === 'reject') {
                await adminApi.reject(currentRestaurantId, { rejection_reason: reason });
                showToast('Restaurant rejected', 'success');
            } else if (currentAction === 'suspend') {
                await adminApi.suspend(currentRestaurantId);
                showToast('Restaurant suspended', 'success');
            } else if (currentAction === 'activate') {
                await adminApi.activate(currentRestaurantId);
                showToast('Restaurant activated', 'success');
            }
            modal?.classList.add('hidden');
            await loadRestaurants();
        } catch (err) {
            const msg = err.response?.data?.detail || err.message || `Failed to ${currentAction}`;
            showToast(typeof msg === 'string' ? msg : 'Action failed', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Confirm';
        }
    });

    // ── Filter & Pagination ───────────────────────────────────────────────
    statusFilter?.addEventListener('change', () => {
        currentPage = 1;
        loadRestaurants();
    });

    prevBtn?.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; loadRestaurants(); }
    });

    nextBtn?.addEventListener('click', () => {
        currentPage++;
        loadRestaurants();
    });

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    // ── Initial Load ──────────────────────────────────────────────────────
    await loadRestaurants();
});
