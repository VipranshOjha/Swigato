import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRestaurants } from '../../hooks/queries/useRestaurantQueries';
import { RestaurantCard } from '../../components/cards/RestaurantCard';
import { RestaurantCardSkeleton } from '../../components/skeletons';
import { ErrorState } from '../../components/common/ErrorState';
import { ROUTES } from '../../constants/routes';

export const Home = () => {
    const navigate = useNavigate();
    const { 
        data: restaurants, 
        isLoading, 
        error 
    } = useRestaurants({ limit: 4 });

    return (
        <div className="w-full">
            {/* Hero Section */}
            <section className="bg-primary/5 py-16 px-4 mb-12 rounded-b-3xl">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-6">
                        <h1 className="text-display-sm md:text-display-md font-black text-on-surface">
                            Hungry? <br/>
                            <span className="text-primary">We've got you covered.</span>
                        </h1>
                        <p className="text-body-lg text-on-surface-variant max-w-md">
                            Discover the best food and drinks from top restaurants around you, delivered fast.
                        </p>
                        <div className="flex gap-4 pt-4">
                            <button 
                                onClick={() => navigate(ROUTES.RESTAURANTS)}
                                className="px-8 py-4 bg-primary text-on-primary rounded-xl font-black text-lg hover:bg-primary/90 transition-all shadow-[0_4px_14px_0_rgba(255,87,34,0.39)] hover:shadow-[0_6px_20px_rgba(255,87,34,0.23)] hover:-translate-y-1"
                            >
                                Order Now
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 w-full max-w-md relative">
                        <img 
                            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80" 
                            alt="Hero Food" 
                            className="rounded-[2rem] shadow-2xl object-cover h-[300px] w-full"
                        />
                    </div>
                </div>
            </section>

            {/* Featured Restaurants */}
            <section className="max-w-7xl mx-auto px-4 pb-16">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-headline-md font-black text-on-surface mb-2">Featured Restaurants</h2>
                        <p className="text-body-md text-on-surface-variant">Top rated places near you</p>
                    </div>
                    <Link 
                        to={ROUTES.HOME + 'restaurants'} 
                        className="text-primary font-bold hover:underline mb-1"
                    >
                        See All
                    </Link>
                </div>

                {error ? (
                    <ErrorState 
                        title="Failed to load restaurants" 
                        message={error.message || error}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {isLoading || !restaurants ? (
                            // Skeletons
                            Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)
                        ) : (
                            // Data
                            restaurants?.items?.map(restaurant => (
                                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                            ))
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};
