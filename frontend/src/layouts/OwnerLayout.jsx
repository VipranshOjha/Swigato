import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { OwnerSidebar } from '../components/owner/OwnerSidebar';
import { OwnerTopbar } from '../components/owner/OwnerTopbar';

export const OwnerLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-surface-container-low">
            <OwnerSidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />
            
            <main className="flex-grow flex flex-col h-screen overflow-hidden">
                <OwnerTopbar onMenuClick={() => setIsSidebarOpen(true)} />
                <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-surface-container-lowest">
                    {/* Add error boundary wrapper here later as requested */}
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
