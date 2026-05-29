import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    maxWidth = "max-w-lg" 
}) => {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
                aria-hidden="true"
            />
            
            {/* Modal Content */}
            <div className={`relative bg-surface-container-lowest w-full ${maxWidth} rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200`}>
                
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high">
                        <h2 className="text-headline-md font-bold text-on-surface">{title}</h2>
                        <button 
                            onClick={onClose}
                            className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}
                
                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                    {children}
                </div>
            </div>
        </div>
    );
};
