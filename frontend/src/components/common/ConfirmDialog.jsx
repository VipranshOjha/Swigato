import React from 'react';
import { Modal } from './Modal';
import { Loader2 } from 'lucide-react';

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDestructive = false,
    isLoading = false
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
            <div className="pt-2">
                <p className="text-body-lg text-on-surface-variant mb-6">
                    {message}
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 font-bold rounded-lg transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-70 ${
                            isDestructive
                                ? 'bg-error text-on-error hover:bg-error/90'
                                : 'bg-primary text-on-primary hover:bg-primary/90'
                        }`}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
