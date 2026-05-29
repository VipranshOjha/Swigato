/**
 * @deprecated Use React Query hooks from src/hooks/queries/ and src/hooks/mutations/ instead.
 * This hook is retained temporarily for backward compatibility during migration.
 * Will be removed after all dashboard phases are migrated.
 */
import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

export const useApi = (apiFunc, options = {}) => {
    const [data, setData] = useState(options.initialData || null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const { addToast } = useToast();
    const { onSuccess, onError, successMessage } = options;

    const execute = useCallback(async (...args) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await apiFunc(...args);
            setData(result);
            
            if (successMessage) {
                addToast(successMessage, 'success');
            }
            
            if (onSuccess) {
                onSuccess(result);
            }
            
            return result;
        } catch (err) {
            const errMsg = err.message || 'An error occurred';
            setError(errMsg);
            
            if (options.showErrorToast !== false) {
                addToast(errMsg, 'error');
            }
            
            if (onError) {
                onError(err);
            }
            
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [apiFunc, addToast, onSuccess, onError, successMessage, options.showErrorToast]);

    return {
        data,
        error,
        isLoading,
        execute,
        setData,
        setError
    };
};
