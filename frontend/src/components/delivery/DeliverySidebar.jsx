import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, Settings, X, Bike } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

const NAV_ITEMS = [
    { to: ROUTES.DELIVERY_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: ROUTES.DELIVERY_DASHBOARD + '/history', label: 'Delivery History', icon: History },
    { to: ROUTES.DELIVERY_DASHBOARD + '/settings', label: 'Settings', icon: Settings },
];

export const DeliverySidebar = ({ isOpen, onClose }) => {
    const linkClasses = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
        }`;

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
            )}
            
            <aside className={`
                fixed md:sticky top-0 left-0 z-50 md:z-auto
                w-64 h-screen bg-surface-container-lowest border-r border-surface-container-high
                flex flex-col transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-surface-container-high">
                    <span className="font-black text-xl text-primary flex items-center gap-2">
                        <Bike className="w-5 h-5" /> Rider
                    </span>
                    <button onClick={onClose} className="md:hidden text-on-surface-variant hover:text-on-surface">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <nav className="flex-grow p-4 space-y-1">
                    {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                        <NavLink key={to} to={to} end={end} className={linkClasses} onClick={onClose}>
                            <Icon className="w-4.5 h-4.5" />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
};
