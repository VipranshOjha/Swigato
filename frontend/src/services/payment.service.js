import apiClient from '../api/api.client';

export const paymentService = {
    initializePayment: (orderId, gateway = 'stripe') => 
        apiClient.post(`/payments/orders/${orderId}/initialize`, { gateway }),
        
    // In a real app, this webhook would be triggered by Stripe/Razorpay servers.
    // For Phase 5 MVP, the frontend simulates the webhook to complete the payment loop.
    simulateWebhook: (gateway, payload) => 
        apiClient.post(`/payments/webhooks/${gateway}`, payload)
};
