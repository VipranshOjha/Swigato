import React from 'react';
import { Link } from 'react-router-dom';
import { getRestaurantPath } from '../../utils/navigation.utils';
import { Star, Clock } from 'lucide-react';
import { cn } from '../common/Toast';

export const RestaurantCard = ({ restaurant }) => {
    const handleMouseEnter = () => {
        // Prefetch restaurant detail route
        import('../../pages/customer/RestaurantDetail');
    };

    return (
        <Link 
            to={getRestaurantPath(restaurant)}
            onMouseEnter={handleMouseEnter}
            className="group block bg-surface-container-lowest rounded-xl overflow-hidden border border-surface-container-high hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
        >
            <div className="relative h-48 w-full bg-surface-container overflow-hidden">
                <img 
                    src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=60'} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                {!restaurant.is_active && (
                    <div className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-surface text-on-surface px-4 py-2 rounded-lg font-bold shadow-lg">
                            Currently Closed
                        </span>
                    </div>
                )}
            </div>
            
            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-headline-md font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {restaurant.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-status-success text-on-primary px-1.5 py-0.5 rounded text-sm font-bold shadow-sm">
                        <span>{restaurant.rating?.toFixed(1) || 'NEW'}</span>
                        <Star className="w-3 h-3 fill-current" />
                    </div>
                </div>
                
                <p className="text-body-sm text-on-surface-variant line-clamp-1 mb-3">
                    {restaurant.cuisine_types?.join(', ') || 'Various Cuisines'}
                </p>
                
                <div className="flex justify-between items-center pt-3 border-t border-surface-container-high/60">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        <span>30-40 min</span>
                    </div>
                    <div className="text-sm font-medium text-on-surface-variant">
                        ₹{restaurant.delivery_fee || 50} Delivery
                    </div>
                </div>
            </div>
        </Link>
    );
};
