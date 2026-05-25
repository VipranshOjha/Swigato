import { userApi } from './api.js';
import { showToast } from './toast.js';

let addresses = [];

document.addEventListener('DOMContentLoaded', async () => {
    const addressesGrid = document.getElementById('addressesGrid');
    const addAddressBtn = document.getElementById('addAddressBtn');

    // Modal elements
    const addressModal = document.getElementById('addressModal');
    const addressModalBackdrop = document.getElementById('addressModalBackdrop');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const addressForm = document.getElementById('addressForm');
    const addressModalTitle = document.getElementById('addressModalTitle');

    // Form inputs
    const addressIdInput = document.getElementById('addressId');
    const addressLabel = document.getElementById('addressLabel');
    const addressLine1 = document.getElementById('addressLine1');
    const addressCity = document.getElementById('addressCity');
    const addressState = document.getElementById('addressState');
    const addressPostalCode = document.getElementById('addressPostalCode');
    const addressCountry = document.getElementById('addressCountry');
    const addressIsDefault = document.getElementById('addressIsDefault');

    // ── Load Addresses ──────────────────────────────────────────────────────
    const loadAddresses = async () => {
        try {
            const { data } = await userApi.addresses();
            addresses = data || [];
            renderAddresses();
        } catch (error) {
            showToast('Failed to load addresses', 'error');
            console.error(error);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────
    const renderAddresses = () => {
        addressesGrid.innerHTML = '';

        if (addresses.length === 0) {
            addressesGrid.innerHTML = '<p class="col-span-full text-center text-on-surface-variant py-8">No addresses found. Add a new one.</p>';
            return;
        }

        addresses.forEach(addr => {
            const label = addr.label || 'Other';
            const isDefaultStr = addr.is_default
                ? '<span class="bg-primary-fixed text-primary font-body-sm text-body-sm px-2.5 py-0.5 rounded-full border border-primary-fixed-dim">Default</span>'
                : '';

            const icon = label.toLowerCase() === 'home' ? 'home'
                : label.toLowerCase() === 'work' ? 'work'
                : 'location_on';

            const setDefaultBtn = addr.is_default
                ? '<div class="flex-grow"></div>'
                : `<div class="flex-grow"></div><button class="set-default-btn text-on-surface-variant hover:text-primary-container transition-colors font-label-bold text-label-bold text-right active:scale-95 opacity-0 group-hover:opacity-100 md:opacity-100" data-id="${addr.id}">Set as Default</button>`;

            const card = document.createElement('div');
            card.className = `bg-surface-container-lowest rounded-lg border p-card-padding shadow-sm hover:shadow-md transition-all relative flex flex-col group ${addr.is_default ? 'border-primary-container' : 'border-outline-variant hover:border-outline'}`;

            const highlight = addr.is_default ? '<div class="absolute top-0 left-0 w-1 h-full bg-primary-container"></div>' : '';

            card.innerHTML = `
                ${highlight}
                <div class="flex items-start justify-between mb-3 pl-2">
                    <div class="flex items-center gap-2 text-on-surface">
                        <span class="material-symbols-outlined ${addr.is_default ? 'text-primary-container icon-filled' : ''}">${icon}</span>
                        <h2 class="font-headline-md text-headline-md">${escapeHtml(label)}</h2>
                    </div>
                    ${isDefaultStr}
                </div>
                <div class="font-body-md text-body-md text-on-surface-variant flex-grow pl-2">
                    <p>${escapeHtml(addr.address_line1)}</p>
                    ${addr.address_line2 ? `<p>${escapeHtml(addr.address_line2)}</p>` : ''}
                    ${addr.landmark ? `<p class="text-sm text-on-surface-variant/70">Near: ${escapeHtml(addr.landmark)}</p>` : ''}
                    <p>${escapeHtml(addr.city)}, ${escapeHtml(addr.state)}</p>
                    <p>${escapeHtml(addr.country)} ${escapeHtml(addr.postal_code)}</p>
                </div>
                <div class="flex items-center gap-4 mt-6 pt-4 border-t border-surface-variant pl-2">
                    <button class="edit-btn text-primary-container hover:text-primary transition-colors font-label-bold text-label-bold flex items-center gap-1 active:scale-95" data-id="${addr.id}">
                        <span class="material-symbols-outlined text-[16px]">edit</span> Edit
                    </button>
                    <button class="delete-btn text-status-error hover:opacity-80 transition-colors font-label-bold text-label-bold flex items-center gap-1 active:scale-95" data-id="${addr.id}">
                        <span class="material-symbols-outlined text-[16px]">delete</span> Delete
                    </button>
                    ${setDefaultBtn}
                </div>
            `;
            addressesGrid.appendChild(card);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEdit));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDelete));
        document.querySelectorAll('.set-default-btn').forEach(btn => btn.addEventListener('click', handleSetDefault));
    };

    // ── Actions ─────────────────────────────────────────────────────────────
    const handleEdit = (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const addr = addresses.find(a => a.id === id);
        if (!addr) return;

        addressIdInput.value = addr.id;
        addressLabel.value = addr.label || '';
        addressLine1.value = addr.address_line1;
        addressCity.value = addr.city;
        addressState.value = addr.state;
        addressPostalCode.value = addr.postal_code;
        addressCountry.value = addr.country;
        if (addressIsDefault) addressIsDefault.checked = addr.is_default;

        addressModalTitle.innerText = 'Edit Address';
        openModal();
    };

    const handleDelete = async (e) => {
        if (!confirm('Are you sure you want to delete this address?')) return;
        const id = e.currentTarget.dataset.id;
        try {
            await userApi.deleteAddress(id);
            showToast('Address deleted', 'success');
            await loadAddresses();
        } catch {
            showToast('Failed to delete address', 'error');
        }
    };

    const handleSetDefault = async (e) => {
        const id = e.currentTarget.dataset.id;
        try {
            await userApi.setDefaultAddress(id);
            showToast('Default address updated', 'success');
            await loadAddresses();
        } catch {
            showToast('Failed to set default address', 'error');
        }
    };

    // ── Modal ────────────────────────────────────────────────────────────────
    const openModal = () => addressModal.classList.remove('hidden');
    const closeModal = () => {
        addressModal.classList.add('hidden');
        addressForm.reset();
        addressIdInput.value = '';
        addressModalTitle.innerText = 'Add Address';
    };

    addAddressBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    if (addressModalBackdrop) {
        addressModalBackdrop.addEventListener('click', closeModal);
    }

    // ── Form Submit ──────────────────────────────────────────────────────────
    addressForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            label: addressLabel.value.trim() || 'Home',
            address_line1: addressLine1.value.trim(),
            city: addressCity.value.trim(),
            state: addressState.value.trim(),
            postal_code: addressPostalCode.value.trim(),
            country: addressCountry.value.trim() || 'India',
        };

        const isDefaultChecked = addressIsDefault?.checked ?? false;
        
        // Only include is_default for create, as AddressUpdate schema ignores it
        if (!addressIdInput.value) {
            payload.is_default = isDefaultChecked;
        }

        const id = addressIdInput.value;
        const saveBtn = addressForm.querySelector('button[type="submit"]');
        const originalText = saveBtn?.innerText;
        if (saveBtn) { saveBtn.disabled = true; saveBtn.innerText = 'Saving...'; }

        try {
            if (id) {
                await userApi.updateAddress(id, payload);
                if (isDefaultChecked) {
                    await userApi.setDefaultAddress(id);
                }
                showToast('Address updated', 'success');
            } else {
                await userApi.createAddress(payload);
                showToast('Address added', 'success');
            }
            closeModal();
            await loadAddresses();
        } catch (error) {
            const msg = error.response?.data?.detail || 'Failed to save address';
            showToast(typeof msg === 'string' ? msg : 'Failed to save address', 'error');
        } finally {
            if (saveBtn) { saveBtn.disabled = false; saveBtn.innerText = originalText; }
        }
    });

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    await loadAddresses();
});
