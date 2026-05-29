import { useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useCart } from '../queries/useCartQueries';
import { useUpdateCartMutation, useClearCartMutation } from '../mutations/useCartMutations';

export const useCartActions = () => {
    const { isAuthenticated } = useAuth();
    const { addToast } = useToast();
    const { data: cart } = useCart();
    
    const updateMutation = useUpdateCartMutation();
    const clearMutation = useClearCartMutation();
    const debounceRef = useRef(null);

    const addItem = useCallback((item, quantity = 1) => {
        if (!isAuthenticated) {
            addToast('Please login to add items to your cart', 'warning');
            return;
        }

        if (cart && cart.restaurant_id && cart.restaurant_id !== item.restaurant_id) {
            addToast('You already have items from another restaurant in your cart. Please clear them first.', 'error');
            return;
        }

        updateMutation.mutate({ 
            menuItemId: item.id, 
            quantity, 
            itemDetails: item 
        }, {
            onError: (err) => {
                addToast(err.message || 'Failed to add item', 'error');
            }
        });
    }, [isAuthenticated, cart, addToast, updateMutation]);

    const updateQuantity = useCallback((cartItemId, newQuantity) => {
        const item = cart?.items?.find(i => i.id === cartItemId);
        if (!item) return;

        const menuItemId = item.menu_item_id;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            updateMutation.mutate({ 
                menuItemId, 
                quantity: newQuantity, 
                isUpdate: true,
                itemDetails: { price: item.price, name: item.name, is_veg: item.is_veg, restaurant_id: cart?.restaurant_id } 
            }, {
                onError: (err) => {
                    addToast(err.message || 'Failed to update quantity', 'error');
                }
            });
        }, 300);
    }, [cart, addToast, updateMutation]);

    const clearCart = useCallback(async () => {
        return new Promise((resolve, reject) => {
            clearMutation.mutate(undefined, {
                onSuccess: () => {
                    addToast('Cart cleared', 'info');
                    resolve();
                },
                onError: (err) => {
                    addToast(err.message || 'Failed to clear cart', 'error');
                    reject(err);
                }
            });
        });
    }, [clearMutation, addToast]);

    return {
        addItem,
        updateQuantity,
        clearCart,
        isUpdating: updateMutation.isPending || clearMutation.isPending
    };
};
