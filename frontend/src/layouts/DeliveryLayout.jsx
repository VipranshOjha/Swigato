import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DeliverySidebar } from '../components/delivery/DeliverySidebar';
import { DeliveryTopbar } from '../components/delivery/DeliveryTopbar';

export const DeliveryLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-surface-container-low">
            <DeliverySidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
            />
            
            <main className="flex-grow flex flex-col h-screen overflow-hidden relative">
                <DeliveryTopbar onMenuClick={() => setIsSidebarOpen(true)} />
                <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-surface-container-lowest">
                    <div className="max-w-4xl mx-auto w-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
