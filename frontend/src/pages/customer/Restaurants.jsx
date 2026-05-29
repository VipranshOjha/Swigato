import React, { useState } from 'react';
import { useRestaurants } from '../../hooks/queries/useRestaurantQueries';
import { RestaurantCard } from '../../components/cards/RestaurantCard';
import { RestaurantCardSkeleton } from '../../components/skeletons';
import { SearchBar } from '../../components/common/SearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { normalizePaginatedResponse } from '../../utils/api.utils';
import { Store } from 'lucide-react';

export const Restaurants = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const queryParams = { limit: 20 };
    if (searchQuery) queryParams.search = searchQuery;

    const { 
        data: restaurants, 
        isLoading, 
        error,
        refetch
    } = useRestaurants(queryParams);

    const data = normalizePaginatedResponse(restaurants);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-display-sm font-black text-on-surface mb-2">Restaurants</h1>
                    <p className="text-body-md text-on-surface-variant">Find the best food around you</p>
                </div>
                
                <div className="w-full md:w-96">
                    <SearchBar 
                        value={searchQuery} 
                        onChange={setSearchQuery} 
                        placeholder="Search for restaurants or cuisines..." 
                    />
                </div>
            </div>

            {error ? (
                <ErrorState 
                    title="Could not load restaurants" 
                    message={error.message || error}
                    onRetry={() => refetch()}
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
                        ) : data.items.length === 0 ? (
                            <div className="col-span-full">
                                <EmptyState 
                                    icon={Store}
                                    title="No restaurants found" 
                                    description={searchQuery ? `We couldn't find anything matching "${searchQuery}".` : "There are currently no restaurants available."}
                                />
                            </div>
                        ) : (
                            data.items.map(restaurant => (
                                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
