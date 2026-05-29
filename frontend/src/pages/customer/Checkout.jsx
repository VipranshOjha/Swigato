import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/queries/useCartQueries';
import { useCartActions } from '../../hooks/actions/useCartActions';
import { useAddresses } from '../../hooks/queries/useAddressQueries';
import { usePlaceOrderMutation } from '../../hooks/mutations/useOrderMutations';
import { getOrderPath } from '../../utils/navigation.utils';
import { DeliveryAddressCard } from '../../components/checkout/DeliveryAddressCard';
import { CheckoutSummary } from '../../components/checkout/CheckoutSummary';
import { OrderNotes } from '../../components/checkout/OrderNotes';
import { OrderPriceBreakdown } from '../../components/order/OrderPriceBreakdown';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { MapPin, CreditCard, ShoppingBag, Info } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useToast } from '../../contexts/ToastContext';
import { paymentService } from '../../services/payment.service';

export const Checkout = () => {
    const { data: cart } = useCart();
    const { clearCart } = useCartActions();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CARD');
    const [orderNotes, setOrderNotes] = useState('');

    const { 
        data: addresses, 
        isLoading: isAddressesLoading, 
        error: addressesError, 
        refetch: fetchAddresses 
    } = useAddresses();
    
    const placeOrderMutation = usePlaceOrderMutation();
    const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
    const isPlacingOrder = placeOrderMutation.isPending || isSimulatingPayment;

    // Auto-select first address if available
    useEffect(() => {
        if (addresses?.length > 0 && !selectedAddressId) {
            setSelectedAddressId(addresses[0].id);
        }
    }, [addresses, selectedAddressId]);

    // Redirect to cart if empty
    useEffect(() => {
        if (cart && (!cart.items || cart.items.length === 0)) {
            navigate(ROUTES.CART);
        }
    }, [cart, navigate]);

    if (!cart) return <PageLoader text="Loading checkout..." />;

    const handlePlaceOrder = () => {
        if (!selectedAddressId) {
            addToast('Please select a delivery address', 'warning');
            return;
        }

        const orderData = {
            restaurant_id: cart.restaurant_id,
            delivery_address_id: selectedAddressId,
            payment_method: paymentMethod,
            items: cart.items.map(item => ({
                menu_item_id: item.menu_item_id,
                quantity: item.quantity,
                price_at_time: item.price
            })),
            notes: orderNotes
        };

        placeOrderMutation.mutate(orderData, {
            onSuccess: async (response) => {
                try {
                    setIsSimulatingPayment(true);
                    
                    // 1. Initialize payment (transitions order to AWAITING_PAYMENT)
                    const intent = await paymentService.initializePayment(response.id, 'stripe');
                    
                    // 2. Simulate webhook capture (transitions order to PLACED)
                    const webhookPayload = {
                        provider_payment_id: intent.provider_payment_id,
                        status: "captured",
                        method: paymentMethod,
                        type: "payment.captured"
                    };
                    await paymentService.simulateWebhook('stripe', webhookPayload);

                    addToast('Order placed successfully!', 'success');
                    clearCart();
                    navigate(`/orders/${response.id}/success`);
                } catch (error) {
                    addToast('Payment simulation failed: ' + error.message, 'error');
                } finally {
                    setIsSimulatingPayment(false);
                }
            },
            onError: (error) => {
                addToast(error.message || 'Failed to place order', 'error');
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-display-sm font-black text-on-surface mb-8">Complete Your Order</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Address & Payment */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Delivery Address Section */}
                    <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-sm">
                        <div className="flex items-center gap-3 mb-6 border-b border-surface-container-high pb-4">
                            <div className="bg-primary-container text-primary p-2 rounded-lg">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <h2 className="text-headline-sm font-bold text-on-surface">Delivery Address</h2>
                        </div>
                        
                        {isAddressesLoading ? (
                            <PageLoader text="Loading addresses..." />
                        ) : addressesError ? (
                            <ErrorState title="Failed to load addresses" message={addressesError} onRetry={fetchAddresses} />
                        ) : addresses?.length === 0 ? (
                            <div className="text-center py-6 text-on-surface-variant bg-surface-container-low rounded-xl">
                                <p className="mb-4">You don't have any saved addresses.</p>
                                {/* In a real app, this would open an Add Address modal */}
                                <button className="px-4 py-2 bg-surface border border-surface-container-highest rounded-lg font-bold">
                                    Add New Address
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addresses?.map(address => (
                                    <DeliveryAddressCard 
                                        key={address.id}
                                        address={address}
                                        isSelected={selectedAddressId === address.id}
                                        onSelect={() => setSelectedAddressId(address.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment Method Section */}
                    <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-sm">
                        <div className="flex items-center gap-3 mb-6 border-b border-surface-container-high pb-4">
                            <div className="bg-primary-container text-primary p-2 rounded-lg">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <h2 className="text-headline-sm font-bold text-on-surface">Payment Method</h2>
                        </div>
                        
                        <div className="space-y-3">
                            {['CARD', 'UPI', 'CASH_ON_DELIVERY'].map(method => (
                                <label 
                                    key={method} 
                                    className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                                        paymentMethod === method 
                                            ? 'border-primary bg-primary/5' 
                                            : 'border-surface-container-high hover:bg-surface-container-low'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="radio" 
                                            name="paymentMethod" 
                                            value={method} 
                                            checked={paymentMethod === method}
                                            onChange={() => setPaymentMethod(method)}
                                            className="w-4 h-4 text-primary focus:ring-primary"
                                        />
                                        <span className="font-medium text-on-surface">
                                            {method.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    <OrderNotes value={orderNotes} onChange={setOrderNotes} />
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-sm sticky top-24">
                        <h2 className="text-headline-sm font-bold text-on-surface mb-4">Order Summary</h2>
                        
                        <div className="flex items-center gap-2 text-sm font-bold text-on-surface mb-4 bg-surface-container-low px-4 py-3 rounded-xl border border-surface-container-high">
                            <ShoppingBag className="w-4 h-4 text-primary" />
                            <span>{cart.items.length} Items</span>
                        </div>
                        
                        <CheckoutSummary items={cart.items} />

                        <OrderPriceBreakdown 
                            itemTotal={cart.item_total}
                            deliveryFee={cart.delivery_fee}
                            taxes={cart.taxes}
                            totalAmount={cart.total_amount}
                        />

                        <button 
                            onClick={handlePlaceOrder}
                            disabled={isPlacingOrder || !selectedAddressId}
                            className="w-full mt-6 py-4 bg-primary text-on-primary rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:shadow-lg disabled:cursor-not-allowed relative overflow-hidden flex justify-center items-center gap-2 group"
                        >
                            {isPlacingOrder ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                                    Placing Order...
                                </>
                            ) : (
                                <>
                                    Place Order
                                    <CreditCard className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        
                        {!selectedAddressId && (
                            <p className="flex items-center gap-1.5 text-xs text-error mt-3 font-medium justify-center">
                                <Info className="w-3.5 h-3.5" />
                                Please select a delivery address
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
