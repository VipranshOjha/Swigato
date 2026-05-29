import React from 'react';
import { Link } from 'react-router-dom';
import { useOwnerRestaurants } from '../../hooks/queries/useOwnerQueries';
import { ownerService } from '../../services/owner.service';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query/queryKeys';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../contexts/ToastContext';
import { Store, MapPin, Edit3, Menu as MenuIcon, ExternalLink } from 'lucide-react';

export const Restaurants = () => {
    const { data: restaurants, isLoading, error } = useOwnerRestaurants();
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            // Optimistic update isn't strictly necessary here if the API is fast,
            // but we use the existing service.
            await ownerService.updateRestaurant(id, { is_open: !currentStatus });
            queryClient.invalidateQueries({ queryKey: queryKeys.owner.restaurants.lists() });
            addToast(`Restaurant ${!currentStatus ? 'opened' : 'closed'} successfully`, 'success');
        } catch (err) {
            addToast('Failed to update status', 'error');
        }
    };

    if (isLoading) return <PageLoader message="Loading restaurants..." />;
    if (error) return <ErrorState message={error.message} />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-on-surface">My Restaurants</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Manage your active locations.</p>
                </div>
            </div>

            {restaurants?.length === 0 ? (
                <div className="bg-surface-container-lowest p-12 rounded-xl border border-surface-container-high text-center">
                    <Store className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-on-surface">No restaurants yet</h3>
                    <p className="text-on-surface-variant mt-2 max-w-sm mx-auto">
                        You haven't added any restaurants yet. Contact admin to onboard a new location.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {restaurants?.map(rest => (
                        <div key={rest.id} className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden flex flex-col">
                            <div className="h-32 bg-surface-container overflow-hidden relative">
                                {rest.cover_image_url ? (
                                    <img src={rest.cover_image_url} alt={rest.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary-container text-primary">
                                        <Store className="w-8 h-8 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full shadow-sm ${
                                        rest.is_open 
                                            ? 'bg-status-success text-white' 
                                            : 'bg-surface-container-high text-on-surface-variant'
                                    }`}>
                                        {rest.is_open ? 'OPEN' : 'CLOSED'}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-5 flex-grow flex flex-col">
                                <h3 className="text-lg font-bold text-on-surface mb-1">{rest.name}</h3>
                                <p className="text-sm text-on-surface-variant flex items-start gap-1.5 mb-4 line-clamp-2">
                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>{rest.address}, {rest.city}</span>
                                </p>
                                
                                <div className="mt-auto pt-4 border-t border-surface-container-high flex flex-wrap gap-2">
                                    <button 
                                        onClick={() => handleToggleStatus(rest.id, rest.is_open)}
                                        className={`flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-bold transition-colors border ${
                                            rest.is_open
                                                ? 'border-error text-error hover:bg-error-container/50'
                                                : 'border-status-success text-status-success hover:bg-status-success/10'
                                        }`}
                                    >
                                        {rest.is_open ? 'Close Now' : 'Open Now'}
                                    </button>
                                    
                                    <Link 
                                        to={`/owner/menu/${rest.id}`}
                                        className="flex-1 min-w-[100px] py-2 px-3 rounded-lg text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <MenuIcon className="w-4 h-4" /> Menu
                                    </Link>
                                </div>
                                
                                <div className="flex gap-2 mt-2">
                                    <Link 
                                        to={`/owner/restaurants/${rest.id}/edit`}
                                        className="flex-1 py-2 px-3 rounded-lg text-sm font-bold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Edit3 className="w-4 h-4" /> Edit Details
                                    </Link>
                                    <Link 
                                        to={`/restaurants/${rest.id}`}
                                        target="_blank"
                                        className="py-2 px-3 rounded-lg text-sm font-bold bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center"
                                        title="View Public Page"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
