import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoader = ({ text = "Loading..." }) => {
    return (
        <div className="w-full min-h-[400px] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-container mb-4" />
            <p className="text-on-surface-variant font-body-md animate-pulse">{text}</p>
        </div>
    );
};
