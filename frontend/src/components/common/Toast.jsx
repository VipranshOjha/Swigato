import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const icons = {
    success: <CheckCircle className="w-5 h-5 text-status-success" />,
    error: <XCircle className="w-5 h-5 text-status-error" />,
    warning: <AlertCircle className="w-5 h-5 text-status-warning" />,
    info: <Info className="w-5 h-5 text-primary" />
};

export const Toast = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-lg shadow-lg border border-surface-container-high min-w-[300px] animate-in fade-in slide-in-from-bottom-4 duration-300">
            {icons[type]}
            <p className="flex-grow font-body-md text-on-surface">{message}</p>
            <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-1 transition-colors">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
