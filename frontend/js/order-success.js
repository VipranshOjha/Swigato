import { customerOrderApi } from './api.js';
import { isAuthenticated } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html?redirect=/order-success.html' + window.location.search;
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        showError("No order ID provided");
        return;
    }

    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const successContent = document.getElementById('successContent');

    try {
        const res = await customerOrderApi.get(orderId);
        const order = res.data;

        document.getElementById('displayRestaurant').textContent = order.restaurant?.name || 'the restaurant';
        document.getElementById('displayOrderId').textContent = order.id;
        document.getElementById('displayAmount').textContent = `₹${order.total_amount}`;

        document.getElementById('trackOrderBtn').addEventListener('click', () => {
            window.location.href = `/order-detail.html?id=${order.id}`;
        });

        loadingState.classList.add('hidden');
        successContent.classList.remove('hidden');
        successContent.classList.add('flex');

    } catch (err) {
        console.error(err);
        showError(err.response?.data?.detail || "Failed to fetch order details");
    }

    function showError(msg) {
        loadingState.classList.add('hidden');
        successContent.classList.add('hidden');
        successContent.classList.remove('flex');
        errorState.classList.remove('hidden');
        errorState.classList.add('flex');
        document.getElementById('errorMessage').textContent = msg;
    }
});
