import { ownerApi } from './api.js';
import { showToast } from './toast.js';
import { requireRole, logout, getUserProfile } from './auth.js';

// ── Auth Guard ────────────────────────────────────────────────────────────────
if (!requireRole('restaurant_owner')) {
    // requireRole redirects, but we stop execution just in case
    throw new Error('Unauthorized');
}

document.addEventListener('DOMContentLoaded', async () => {
    // ── Header: show username ─────────────────────────────────────────────
    const user = getUserProfile();
    const ownerNameEl = document.getElementById('ownerName');
    if (ownerNameEl && user) {
        ownerNameEl.textContent = `Owner #${user.sub}`;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => logout());

    // ── Load My Restaurants ───────────────────────────────────────────────
    const grid = document.getElementById('restaurantsGrid');
    const loadingEl = document.getElementById('loadingState');
    const emptyEl = document.getElementById('emptyState');

    try {
        loadingEl?.classList.remove('hidden');
        const { data: restaurants } = await ownerApi.list();
        loadingEl?.classList.add('hidden');

        if (!restaurants || restaurants.length === 0) {
            emptyEl?.classList.remove('hidden');
            return;
        }

        grid.innerHTML = restaurants.map(r => `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div class="h-32 bg-gradient-to-br from-orange-100 to-orange-50 relative flex items-center justify-center">
                    ${r.cover_image_url
                        ? `<img src="${escapeHtml(r.cover_image_url)}" class="w-full h-full object-cover">`
                        : `<svg class="w-12 h-12 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>`
                    }
                    <div class="absolute top-2 right-2">
                        ${statusBadge(r.approval_status)}
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="text-lg font-bold text-gray-900 truncate">${escapeHtml(r.name)}</h3>
                    <p class="text-sm text-gray-500 mt-0.5 truncate">${escapeHtml(r.city)}, ${escapeHtml(r.state)}</p>
                    <p class="text-sm text-gray-400 mt-1 truncate">${escapeHtml(r.phone)} · ${escapeHtml(r.email)}</p>

                    ${r.rejection_reason ? `
                        <div class="mt-2 p-2 bg-red-50 rounded text-xs text-red-600 border border-red-200">
                            <strong>Rejection reason:</strong> ${escapeHtml(r.rejection_reason)}
                        </div>
                    ` : ''}

                    <div class="flex items-center gap-2 mt-4">
                        <a href="/owner-restaurant-detail.html?id=${r.id}"
                           class="flex-1 text-center text-sm font-medium py-2 px-3 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors">
                            View / Edit
                        </a>
                        ${r.approval_status === 'DRAFT' || r.approval_status === 'REJECTED' ? `
                            <button class="submit-btn flex-1 text-sm font-medium py-2 px-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                    data-id="${r.id}">
                                Submit for Approval
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // Submit for approval
        document.querySelectorAll('.submit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                btn.disabled = true;
                btn.textContent = 'Submitting...';
                try {
                    await ownerApi.submit(id);
                    showToast('Submitted for approval!', 'success');
                    setTimeout(() => location.reload(), 1000);
                } catch (err) {
                    const msg = err.response?.data?.detail || 'Failed to submit';
                    showToast(typeof msg === 'string' ? msg : 'Failed to submit', 'error');
                    btn.disabled = false;
                    btn.textContent = 'Submit for Approval';
                }
            });
        });

    } catch (err) {
        loadingEl?.classList.add('hidden');
        console.error(err);
        showToast('Failed to load restaurants', 'error');
    }
});

function statusBadge(status) {
    const map = {
        'DRAFT': 'bg-gray-100 text-gray-700',
        'PENDING_APPROVAL': 'bg-yellow-100 text-yellow-700',
        'APPROVED': 'bg-green-100 text-green-700',
        'REJECTED': 'bg-red-100 text-red-700',
        'SUSPENDED': 'bg-orange-100 text-orange-700',
    };
    const label = status?.replace(/_/g, ' ') || 'DRAFT';
    const cls = map[status] || 'bg-gray-100 text-gray-700';
    return `<span class="text-xs font-semibold px-2 py-1 rounded-full ${cls}">${label}</span>`;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
