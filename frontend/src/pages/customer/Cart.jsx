import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/queries/useCartQueries';
import { useCartActions } from '../../hooks/actions/useCartActions';
import { useAuth } from '../../contexts/AuthContext';
import { CartItemCard } from '../../components/cart/CartItemCard';
import { EmptyState } from '../../components/common/EmptyState';
import { ClearCartModal } from '../../components/cart/ClearCartModal';
import { ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const Cart = () => {
    const { data: cart, isLoading } = useCart();
    const { clearCart } = useCartActions();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isClearDialogOpen, setIsClearDialogOpen] = React.useState(false);

    if (!isAuthenticated) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-16">
                <EmptyState 
                    icon={ShoppingBag}
                    title="Please Login"
                    description="You must be logged in to view your cart."
                    action={
                        <button 
                            onClick={() => navigate(ROUTES.LOGIN)}
                            className="w-full py-4 bg-primary text-on-primary rounded-xl font-black text-lg shadow-sm hover:bg-primary/90 transition-colors"
                        >
                            Login Now
                        </button>
                    }
                />
            </div>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-16">
                <EmptyState 
                    icon={ShoppingBag}
                    title="Your cart is empty"
                    description="Looks like you haven't added anything to your cart yet."
                    action={
                        <button 
                            onClick={() => navigate(ROUTES.RESTAURANTS)}
                            className="px-6 py-2 bg-primary text-on-primary rounded-xl font-bold mt-4"
                        >
                            Browse Restaurants
                        </button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-display-sm font-black text-on-surface mb-2">Checkout</h1>
                    <p className="text-body-md text-on-surface-variant">Review your order and pay</p>
                </div>
                <button 
                    onClick={() => setIsClearDialogOpen(true)}
                    className="flex items-center gap-2 text-error font-bold hover:bg-error-container/50 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear Cart
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="md:col-span-2">
                    <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-sm">
                        <h2 className="text-headline-sm font-bold text-on-surface mb-6 border-b border-surface-container-high pb-4">
                            Order Items
                        </h2>
                        
                        <div className="flex flex-col">
                            {cart.items.map(item => (
                                <CartItemCard key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bill Details */}
                <div className="md:col-span-1">
                    <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-sm sticky top-24">
                        <h2 className="text-headline-sm font-bold text-on-surface mb-6 border-b border-surface-container-high pb-4">
                            Bill Details
                        </h2>
                        
                        <div className="space-y-4 text-sm mb-6 border-b border-surface-container-high pb-6">
                            <div className="flex justify-between text-on-surface-variant">
                                <span>Item Total</span>
                                <span>₹{cart.item_total?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-on-surface-variant">
                                <span>Delivery Fee</span>
                                <span>₹{cart.delivery_fee?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-on-surface-variant">
                                <span>Taxes and Charges</span>
                                <span>₹{cart.taxes?.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div className="flex justify-between font-black text-lg text-on-surface mb-6">
                            <span>To Pay</span>
                            <span>₹{cart.total_amount?.toFixed(2)}</span>
                        </div>

                        <button 
                            onClick={() => navigate(ROUTES.CHECKOUT)}
                            disabled={isLoading}
                            className="w-full py-3.5 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50"
                        >
                            <span>Proceed to Checkout</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <ClearCartModal 
                isOpen={isClearDialogOpen}
                onClose={() => setIsClearDialogOpen(false)}
            />
        </div>
    );
};
