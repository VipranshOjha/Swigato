import { apiFetch } from './api.js';
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

    // Fetch and render
    const loadAddresses = async () => {
        try {
            addresses = await apiFetch('/api/v1/users/me/addresses') || [];
            renderAddresses();
        } catch (error) {
            showToast('Failed to load addresses', 'error');
            console.error(error);
        }
    };

    const renderAddresses = () => {
        addressesGrid.innerHTML = '';
        if (addresses.length === 0) {
            addressesGrid.innerHTML = '<p class="col-span-full text-center text-on-surface-variant py-8">No addresses found. Add a new one.</p>';
            return;
        }

        addresses.forEach(addr => {
            const isDefaultStr = addr.is_default 
                ? '<span class="bg-primary-fixed text-primary font-body-sm text-body-sm px-2.5 py-0.5 rounded-full border border-primary-fixed-dim">Default</span>'
                : '';
            
            const icon = addr.label.toLowerCase() === 'home' ? 'home' 
                       : addr.label.toLowerCase() === 'work' ? 'work' 
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
                        <span class="material-symbols-outlined ${addr.is_default ? 'text-primary-container icon-filled' : ''}" data-icon="${icon}">${icon}</span>
                        <h2 class="font-headline-md text-headline-md">${addr.label}</h2>
                    </div>
                    ${isDefaultStr}
                </div>
                <div class="font-body-md text-body-md text-on-surface-variant flex-grow pl-2">
                    <p>${addr.address_line1}</p>
                    <p>${addr.city}, ${addr.state}</p>
                    <p>${addr.country} ${addr.postal_code}</p>
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

        // Add event listeners for dynamic buttons
        document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEdit));
        document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDelete));
        document.querySelectorAll('.set-default-btn').forEach(btn => btn.addEventListener('click', handleSetDefault));
    };

    // Actions
    const handleEdit = (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const addr = addresses.find(a => a.id === id);
        if (addr) {
            addressIdInput.value = addr.id;
            addressLabel.value = addr.label;
            addressLine1.value = addr.address_line1;
            addressCity.value = addr.city;
            addressState.value = addr.state;
            addressPostalCode.value = addr.postal_code;
            addressCountry.value = addr.country;
            addressIsDefault.checked = addr.is_default;
            
            addressModalTitle.innerText = 'Edit Address';
            openModal();
        }
    };

    const handleDelete = async (e) => {
        if (!confirm('Are you sure you want to delete this address?')) return;
        const id = e.currentTarget.dataset.id;
        try {
            await apiFetch(`/api/v1/users/me/addresses/${id}`, { method: 'DELETE' });
            showToast('Address deleted', 'success');
            loadAddresses();
        } catch (error) {
            showToast('Failed to delete address', 'error');
        }
    };

    const handleSetDefault = async (e) => {
        const id = e.currentTarget.dataset.id;
        try {
            await apiFetch(`/api/v1/users/me/addresses/${id}/default`, { method: 'PATCH' });
            showToast('Default address updated', 'success');
            loadAddresses();
        } catch (error) {
            showToast('Failed to set default address', 'error');
        }
    };

    // Modal behavior
    const openModal = () => addressModal.classList.remove('hidden');
    const closeModal = () => {
        addressModal.classList.add('hidden');
        addressForm.reset();
        addressIdInput.value = '';
        addressModalTitle.innerText = 'Add Address';
    };

    addAddressBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    addressModalBackdrop.addEventListener('click', closeModal);

    // Form Submit
    addressForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            label: addressLabel.value.trim(),
            address_line1: addressLine1.value.trim(),
            city: addressCity.value.trim(),
            state: addressState.value.trim(),
            postal_code: addressPostalCode.value.trim(),
            country: addressCountry.value.trim(),
            is_default: addressIsDefault.checked,
            latitude: 0,
            longitude: 0
        };

        const id = addressIdInput.value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/v1/users/me/addresses/${id}` : '/api/v1/users/me/addresses';

        try {
            await apiFetch(url, {
                method,
                body: JSON.stringify(payload)
            });
            showToast(id ? 'Address updated' : 'Address added', 'success');
            closeModal();
            loadAddresses();
        } catch (error) {
            showToast('Failed to save address', 'error');
        }
    });

    // Initial load
    loadAddresses();
});
