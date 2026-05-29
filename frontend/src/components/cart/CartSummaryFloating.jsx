import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../hooks/queries/useCartQueries';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const CartSummaryFloating = () => {
    const { data: cart } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    // Hide if on cart or checkout page
    if (location.pathname === ROUTES.CART || location.pathname === ROUTES.CHECKOUT) {
        return null;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return null;
    }

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="pointer-events-auto w-full max-w-md bg-primary text-on-primary rounded-2xl shadow-xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary/90 transition-colors" onClick={() => navigate(ROUTES.CART)}>
                <div className="flex items-center gap-3">
                    <div className="bg-on-primary/20 p-2 rounded-xl">
                        <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-sm uppercase tracking-wider">{totalItems} Item{totalItems > 1 ? 's' : ''}</div>
                        <div className="font-black text-lg leading-none">₹{cart.total_amount?.toFixed(2)}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 font-bold">
                    View Cart
                    <ArrowRight className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};
