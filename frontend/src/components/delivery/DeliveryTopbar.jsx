import React from 'react';
import { Menu, LogOut, Bike } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { OnlineToggle } from './OnlineToggle';

export const DeliveryTopbar = ({ onMenuClick }) => {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-surface-container-lowest border-b border-surface-container-high z-40 sticky top-0 md:static">
            <div className="flex items-center gap-3">
                <button 
                    onClick={onMenuClick}
                    className="md:hidden text-on-surface-variant hover:text-on-surface p-1 rounded-md"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="md:hidden flex items-center gap-2 text-primary font-black text-lg">
                    <Bike className="w-5 h-5" /> Rider
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <OnlineToggle />
                
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-lg border border-surface-container-high">
                    <span className="font-label-bold text-label-bold text-on-surface">
                        {user?.full_name || `Rider #${user?.sub || ''}`}
                    </span>
                </div>
                
                <button 
                    onClick={logout}
                    className="flex items-center gap-2 px-3 py-1.5 text-status-error hover:bg-error-container/50 rounded-lg transition-colors font-medium text-sm"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
};
