import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, ShoppingBag, CreditCard, Bike, Star, LogOut, Search, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { path: '/admin/restaurants', icon: Store, label: 'Restaurants' },
        { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
        { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
        { path: '/admin/delivery', icon: Bike, label: 'Delivery Partners' },
        { path: '/admin/reviews', icon: Star, label: 'Reviews' },
    ];

    return (
        <aside className="w-64 bg-surface-container-lowest border-r border-surface-container-high h-screen sticky top-0 flex flex-col shadow-sm hidden md:flex">
            <div className="p-6">
                <div className="text-2xl font-black text-primary tracking-tight">Swigato<span className="text-on-surface">Admin</span></div>
            </div>
            
            <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.exact}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all
                            ${isActive 
                                ? 'bg-primary text-on-primary shadow-sm' 
                                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}
                        `}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-surface-container-high">
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-bold text-error hover:bg-error-container/30 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export const AdminTopbar = () => {
    const { user } = useAuth();
    const location = useLocation();

    // Generate simple title from path
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/admin') return 'Dashboard';
        if (path.includes('restaurants')) return 'Restaurants';
        if (path.includes('orders')) return 'Orders';
        if (path.includes('payments')) return 'Payments';
        if (path.includes('delivery')) return 'Delivery Partners';
        if (path.includes('reviews')) return 'Reviews';
        return 'Admin Portal';
    };

    return (
        <header className="bg-surface-container-lowest h-20 border-b border-surface-container-high flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
            <h1 className="text-2xl font-black text-on-surface">{getPageTitle()}</h1>
            
            <div className="flex items-center gap-6">
                <div className="relative hidden md:block">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                    <input 
                        type="text" 
                        placeholder="Search anything..." 
                        className="pl-10 pr-4 py-2 bg-surface-container rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
                    />
                </div>
                
                <button className="relative p-2 text-on-surface-variant hover:text-primary transition-colors">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface-container-lowest"></span>
                </button>
                
                <div className="flex items-center gap-3 pl-6 border-l border-surface-container-high">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-on-surface">{user?.first_name} {user?.last_name}</p>
                        <p className="text-xs font-medium text-primary">Administrator</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary-container text-primary flex items-center justify-center font-black shadow-sm ring-2 ring-primary/20">
                        {user?.first_name?.charAt(0) || 'A'}
                    </div>
                </div>
            </div>
        </header>
    );
};
