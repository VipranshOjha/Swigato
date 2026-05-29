import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartContext } from '../../contexts/CartContext';
import { useCart } from '../../hooks/queries/useCartQueries';
import { useCartActions } from '../../hooks/actions/useCartActions';
import { CartItemCard } from './CartItemCard';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const CartDrawer = () => {
    const { isDrawerOpen, closeDrawer } = useCartContext();
    const { data: cart } = useCart();
    const { clearCart } = useCartActions();
    const navigate = useNavigate();

    if (!isDrawerOpen) return null;

    const handleCheckout = () => {
        closeDrawer();
        navigate(ROUTES.CHECKOUT);
    };

    const handleGoToCart = () => {
        closeDrawer();
        navigate(ROUTES.CART);
    };

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-surface-dark/40 z-50 animate-in fade-in duration-200"
                onClick={closeDrawer}
            />
            
            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-surface z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="px-6 py-4 border-b border-surface-container-high flex justify-between items-center bg-surface-container-lowest">
                    <h2 className="text-title-lg font-black text-on-surface flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                        Your Cart
                    </h2>
                    <button onClick={closeDrawer} className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-on-surface-variant">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                    {!cart || !cart.items || cart.items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-on-surface-variant">
                            <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 opacity-50" />
                            </div>
                            <div>
                                <p className="font-bold text-lg text-on-surface mb-1">Your cart is empty</p>
                                <p className="text-sm">Add items from a restaurant to start a new order</p>
                            </div>
                            <button 
                                onClick={() => { closeDrawer(); navigate(ROUTES.RESTAURANTS); }}
                                className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary hover:text-on-primary transition-colors"
                            >
                                Browse Restaurants
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="mb-4 pb-2 border-b border-surface-container-high flex justify-between items-center text-sm">
                                <span className="font-medium text-on-surface-variant">
                                    {cart.items.length} Item{cart.items.length !== 1 ? 's' : ''}
                                </span>
                                <button onClick={clearCart} className="text-error font-bold hover:underline">
                                    Clear all
                                </button>
                            </div>
                            
                            {cart.items.map(item => (
                                <CartItemCard key={item.id} item={item} isCompact={true} />
                            ))}
                        </div>
                    )}
                </div>

                {cart && cart.items && cart.items.length > 0 && (
                    <div className="border-t border-surface-container-high p-6 bg-surface-container-lowest">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-on-surface-variant">Total</span>
                            <span className="font-black text-xl text-on-surface">₹{cart.total_amount?.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={handleGoToCart}
                                className="flex-1 py-3 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors text-center"
                            >
                                View Cart
                            </button>
                            <button 
                                onClick={handleCheckout}
                                className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm flex justify-center items-center gap-2"
                            >
                                Checkout
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
