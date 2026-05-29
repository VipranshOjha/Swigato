import React from 'react';
import { useDeliveryProfile } from '../../hooks/queries/useDeliveryQueries';
import { useToggleOnlineMutation } from '../../hooks/mutations/useDeliveryMutations';
import { useToast } from '../../contexts/ToastContext';
import { Power } from 'lucide-react';

export const OnlineToggle = () => {
    const { addToast } = useToast();
    const { data: profile } = useDeliveryProfile();
    const toggleMutation = useToggleOnlineMutation();

    const isOnline = profile?.is_online || false;

    const handleToggle = async () => {
        try {
            await toggleMutation.mutateAsync(!isOnline);
            addToast(!isOnline ? "You're now online!" : "You're now offline", 'success');
        } catch (error) {
            addToast('Failed to change status. Try again.', 'error');
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={toggleMutation.isPending}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm shadow-sm transition-all duration-200
                ${isOnline 
                    ? 'bg-status-success text-white hover:bg-status-success/90' 
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container'
                }
                ${toggleMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <Power className="w-4 h-4" />
            {toggleMutation.isPending ? 'Updating...' : (isOnline ? 'Online' : 'Offline')}
        </button>
    );
};
