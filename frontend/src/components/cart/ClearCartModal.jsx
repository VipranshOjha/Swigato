import React from 'react';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useCartActions } from '../../hooks/actions/useCartActions';

export const ClearCartModal = ({ isOpen, onClose }) => {
    const { clearCart } = useCartActions();

    const handleConfirm = () => {
        clearCart();
        onClose();
    };

    return (
        <ConfirmDialog 
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={handleConfirm}
            title="Clear Cart?"
            message="Are you sure you want to remove all items from your cart? This action cannot be undone."
            confirmText="Clear Cart"
            isDestructive={true}
        />
    );
};
