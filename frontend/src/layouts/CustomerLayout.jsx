import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';
import { normalizeRoles } from '../utils/roleRedirect';
import { CartSummaryFloating } from '../components/cart/CartSummaryFloating';
import { CartDrawer } from '../components/cart/CartDrawer';
import { useCartContext } from '../contexts/CartContext';

export const CustomerLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { toggleDrawer } = useCartContext();

    return (
        <div className="min-h-screen bg-surface flex flex-col">
        <header className="sticky top-0 z-50 flex justify-between items-center w-full px-4 h-16 bg-surface shadow-sm">
            <Link to={ROUTES.HOME} className="font-black text-2xl text-primary">Swigato</Link>
            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        {(() => {
                            const userRoles = normalizeRoles(user?.roles || user?.role);
                            return (userRoles.length === 0 || userRoles.includes(ROLES.CUSTOMER)) && (
                                <button onClick={toggleDrawer} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer" title="Cart">
                                    <ShoppingCart className="w-6 h-6" />
                                </button>
                            );
                        })()}
                        <button onClick={logout} className="text-on-surface-variant hover:text-error transition-colors" title="Logout">
                            <LogOut className="w-6 h-6" />
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={toggleDrawer} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer" title="Guest Cart">
                            <ShoppingCart className="w-6 h-6" />
                        </button>
                        <Link to={ROUTES.LOGIN} className="text-on-surface-variant hover:text-primary transition-colors">
                            <User className="w-6 h-6" />
                        </Link>
                    </>
                )}
            </div>
        </header>
            <main className="flex-grow">
                <Outlet />
            </main>
            <CartSummaryFloating />
            <CartDrawer />
        </div>
    );
};
