import React from 'react';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({ 
    icon: Icon = PackageOpen, 
    title = "No Data Found", 
    description = "There is nothing to display here right now.",
    action
}) => {
    return (
        <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center bg-surface-container-lowest rounded-xl border border-surface-container-high border-dashed">
            <div className="w-16 h-16 bg-surface-container flex items-center justify-center rounded-full mb-4 text-on-surface-variant">
                <Icon className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-headline-md font-bold text-on-surface mb-2">{title}</h3>
            <p className="text-body-md text-on-surface-variant max-w-sm mb-6">{description}</p>
            {action && (
                <div>{action}</div>
            )}
        </div>
    );
};
