import React from 'react';
import { Store, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RestaurantMetaCard = ({ restaurant }) => {
    if (!restaurant) return null;

    return (
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high shadow-sm hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-container text-primary rounded-xl flex items-center justify-center">
                        <Store className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-on-surface text-lg leading-tight">
                            {restaurant.name || `Restaurant #${restaurant.id?.slice(0, 8)}`}
                        </h3>
                        <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {restaurant.address?.city || 'Location'}
                        </p>
                    </div>
                </div>
                {restaurant.slug && (
                    <Link 
                        to={`/restaurants/${restaurant.slug}`}
                        className="text-primary font-bold text-sm bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-on-primary transition-colors"
                    >
                        View Menu
                    </Link>
                )}
            </div>

            {restaurant.phone && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant border-t border-surface-container-high pt-3">
                    <Phone className="w-4 h-4" />
                    <span>{restaurant.phone}</span>
                </div>
            )}
        </div>
    );
};
