import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRestaurantDetail, useRestaurantMenu } from '../../hooks/queries/useRestaurantQueries';
import { useCart } from '../../hooks/queries/useCartQueries';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { RatingStars } from '../../components/common/RatingStars';
import { MenuItemCard } from '../../components/cards/MenuItemCard';
import { MenuItemSkeleton } from '../../components/skeletons';
import { Clock, Info, ShoppingBag, Store } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const RestaurantDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    
    const { 
        data: restaurant, 
        isLoading: isRestaurantLoading, 
        error: restaurantError,
        refetch: refetchRestaurant
    } = useRestaurantDetail(slug);

    const {
        data: menu,
        isLoading: isMenuLoading,
        error: menuError,
        refetch: refetchMenu
    } = useRestaurantMenu(slug);

    const refetch = () => {
        refetchRestaurant();
        refetchMenu();
    };
    
    const { data: cart } = useCart();
    const [activeCategory, setActiveCategory] = useState('All');

    if (isRestaurantLoading && !restaurant) return <PageLoader text="Loading restaurant details..." />;
    
    if (restaurantError || menuError) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest m-4 rounded-3xl shadow-sm border border-surface-container-high">
            <Store className="w-16 h-16 text-on-surface-variant mb-4 opacity-50" />
            <h2 className="text-2xl font-black text-on-surface mb-2">Restaurant Unavailable</h2>
            <p className="text-on-surface-variant max-w-md mb-6">{(restaurantError || menuError)?.message || 'The restaurant you are looking for does not exist or has been removed.'}</p>
            <button 
                onClick={() => navigate(ROUTES.HOME)}
                className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors"
            >
                Return Home
            </button>
        </div>
    );
    
    if (!restaurant) return null;

    const categoriesData = Array.isArray(menu) ? menu : [];

    // Extract unique categories
    const categories = ['All', ...categoriesData.map(c => c.name).filter(Boolean)];

    const filteredCategories = activeCategory === 'All' 
        ? categoriesData 
        : categoriesData.filter(c => c.name === activeCategory);

    // Calculate cart state for this restaurant
    const isCartFromThisRestaurant = cart?.restaurant_id === restaurant.id;
    const cartItemsCount = isCartFromThisRestaurant ? cart?.items?.reduce((acc, item) => acc + item.quantity, 0) : 0;
    const cartTotal = isCartFromThisRestaurant ? cart?.item_total : 0;

    return (
        <div className="bg-surface min-h-screen pb-24">
            {/* Header */}
            <div className="bg-surface-container-lowest border-b border-surface-container-high pt-8 pb-6">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-display-sm font-black text-on-surface mb-2">{restaurant.name}</h1>
                            <p className="text-body-md text-on-surface-variant mb-4">
                                {restaurant.cuisine_types?.join(', ')} • {restaurant.address}
                            </p>
                        </div>
                        <div className="bg-surface-container rounded-xl p-3 text-center min-w-[80px] shadow-sm border border-surface-container-high">
                            <div className="flex items-center justify-center gap-1 text-status-success font-bold text-lg mb-1">
                                <span>{restaurant.rating?.toFixed(1) || 'NEW'}</span>
                                <RatingStars rating={1} max={1} size="sm" />
                            </div>
                            <div className="text-xs text-on-surface-variant font-medium border-t border-surface-container-high pt-1">
                                {restaurant.total_reviews || 0} Ratings
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-6 text-sm font-bold text-on-surface-variant bg-surface-container px-4 py-3 rounded-xl w-max">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>30-40 mins</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            <span>₹{restaurant.delivery_fee || 50} Delivery</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Category Nav */}
            <div className="sticky top-[72px] z-30 bg-surface/80 backdrop-blur-md border-b border-surface-container shadow-sm">
                <div className="max-w-4xl mx-auto px-4 overflow-x-auto no-scrollbar py-3 flex gap-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-1.5 rounded-full whitespace-nowrap font-bold text-sm transition-colors ${
                                activeCategory === category 
                                    ? 'bg-primary text-on-primary shadow-md' 
                                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Items */}
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {isRestaurantLoading || isMenuLoading ? (
                    <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-surface-container-high shadow-sm">
                        {Array.from({ length: 5 }).map((_, i) => <MenuItemSkeleton key={i} />)}
                    </div>
                ) : filteredCategories.length > 0 ? (
                    filteredCategories.map(category => (
                        <div key={category.id} className="mb-6">
                            <h2 className="text-title-lg font-black text-on-surface mb-4 px-2">{category.name}</h2>
                            <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-surface-container-high shadow-sm">
                                {category.items && category.items.length > 0 ? (
                                    category.items.map(item => (
                                        <MenuItemCard key={item.id} item={item} />
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-on-surface-variant font-medium">
                                        No items in this category.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-sm p-12 text-center text-on-surface-variant font-bold">
                        No menu available.
                    </div>
                )}
            </div>

            {/* Sticky Cart CTA (Mobile + Desktop) */}
            {cartItemsCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-surface-container-high p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full">
                    <div className="max-w-4xl mx-auto flex items-center justify-between bg-primary text-on-primary rounded-xl px-6 py-3 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg" onClick={() => navigate(ROUTES.CART)}>
                        <div>
                            <p className="font-bold">{cartItemsCount} item{cartItemsCount > 1 ? 's' : ''}</p>
                            <p className="text-sm opacity-90">₹{cartTotal} plus taxes</p>
                        </div>
                        <div className="flex items-center gap-2 font-bold">
                            <span>View Cart</span>
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
