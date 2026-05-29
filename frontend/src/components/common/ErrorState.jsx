import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export const ErrorState = ({ 
    title = "Something went wrong", 
    message = "We encountered an unexpected error while loading this data.",
    onRetry
}) => {
    return (
        <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center bg-error-container/10 rounded-xl border border-error-container">
            <div className="w-16 h-16 bg-error-container text-on-error-container flex items-center justify-center rounded-full mb-4">
                <AlertTriangle className="w-8 h-8" strokeWidth={1.5} />
            </div>
            <h3 className="text-headline-md font-bold text-on-surface mb-2">{title}</h3>
            <p className="text-body-md text-error max-w-sm mb-6">{message}</p>
            {onRetry && (
                <button 
                    onClick={onRetry}
                    className="flex items-center gap-2 px-6 py-2.5 bg-surface text-on-surface border border-surface-container-highest rounded-lg font-bold hover:bg-surface-container transition-colors shadow-sm"
                >
                    <RefreshCcw className="w-4 h-4" /> Try Again
                </button>
            )}
        </div>
    );
};
