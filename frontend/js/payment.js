import { customerOrderApi, paymentApi } from './api.js';
import { isAuthenticated } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html?redirect=/payment.html' + window.location.search;
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
    const paymentContent = document.getElementById('paymentContent');
    const pollStatus = document.getElementById('pollStatus');
    
    let currentOrder = null;
    let paymentIntent = null;

    async function initPayment() {
        try {
            // First get the order
            const orderRes = await customerOrderApi.get(orderId);
            currentOrder = orderRes.data;

            if (currentOrder.status === 'placed') {
                window.location.href = `/order-success.html?id=${orderId}`;
                return;
            }

            if (currentOrder.status !== 'pending' && currentOrder.status !== 'payment_failed') {
                if (currentOrder.status === 'awaiting_payment') {
                    // It's already awaiting payment, we just need the display amount, but we might not have the intent ID.
                    // For mock purposes, if it's awaiting payment, we still need an intent to simulate webhook.
                    // If backend doesn't let us re-initialize, we might fail here.
                    // Ideally backend allows re-initialization or we fetch the payment record. 
                    // Let's try initialize anyway.
                } else {
                    showError("Order is not in a valid state for payment.");
                    return;
                }
            }

            // Initialize Payment Intent
            const intentRes = await paymentApi.initialize(orderId, 'razorpay');
            paymentIntent = intentRes.data;

            // Render
            document.getElementById('displayOrderId').textContent = currentOrder.id;
            document.getElementById('displayGateway').textContent = paymentIntent.gateway;
            document.getElementById('displayAmount').textContent = `₹${paymentIntent.amount}`;

            loadingState.classList.add('hidden');
            paymentContent.classList.remove('hidden');
            paymentContent.classList.add('flex');

        } catch (err) {
            console.error(err);
            showError(err.response?.data?.detail || "Failed to initialize payment");
        }
    }

    function showError(msg) {
        loadingState.classList.add('hidden');
        paymentContent.classList.add('hidden');
        paymentContent.classList.remove('flex');
        errorState.classList.remove('hidden');
        errorState.classList.add('flex');
        document.getElementById('errorMessage').textContent = msg;
    }

    async function pollOrderStatus(targetStatus, onSuccess, onFailure) {
        pollStatus.classList.remove('hidden');
        const interval = setInterval(async () => {
            try {
                const res = await customerOrderApi.get(orderId);
                const status = res.data.status;
                if (status === targetStatus) {
                    clearInterval(interval);
                    onSuccess(res.data);
                } else if (status === 'cancelled' || (targetStatus === 'placed' && status === 'payment_failed')) {
                    clearInterval(interval);
                    if (onFailure) onFailure(res.data);
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 2000);
    }

    document.getElementById('btnSuccess').addEventListener('click', async () => {
        try {
            document.getElementById('btnSuccess').disabled = true;
            document.getElementById('btnFailure').disabled = true;
            
            const payload = {
                event_id: "evt_" + Date.now(),
                type: "payment.captured",
                status: "captured",
                provider_payment_id: paymentIntent.provider_payment_id,
                method: "card"
            };
            
            await paymentApi.mockWebhook(paymentIntent.gateway, payload);
            
            pollOrderStatus('placed', () => {
                window.location.href = `/order-success.html?id=${orderId}`;
            }, () => {
                showError("Payment processed but order status did not update to placed.");
            });
            
        } catch (err) {
            console.error(err);
            showError("Failed to simulate webhook success");
        }
    });

    document.getElementById('btnFailure').addEventListener('click', async () => {
        try {
            document.getElementById('btnSuccess').disabled = true;
            document.getElementById('btnFailure').disabled = true;
            
            const payload = {
                event_id: "evt_" + Date.now(),
                type: "payment.failed",
                status: "failed",
                provider_payment_id: paymentIntent.provider_payment_id
            };
            
            await paymentApi.mockWebhook(paymentIntent.gateway, payload);
            
            pollOrderStatus('payment_failed', () => {
                showError("Payment failed. Please try again.");
                document.getElementById('btnSuccess').disabled = false;
                document.getElementById('btnFailure').disabled = false;
                pollStatus.classList.add('hidden');
            });
            
        } catch (err) {
            console.error(err);
            showError("Failed to simulate webhook failure");
        }
    });

    initPayment();
});
