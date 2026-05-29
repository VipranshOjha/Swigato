import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const EmptyOrdersState = () => {
    return (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-surface-container-high shadow-sm">
            <div className="w-24 h-24 bg-primary-container/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-headline-md font-black text-on-surface mb-3">No Orders Yet</h2>
            <p className="text-body-lg text-on-surface-variant max-w-md mx-auto mb-8">
                Looks like you haven't placed any orders yet. Discover delicious food around you!
            </p>
            <Link 
                to={ROUTES.RESTAURANTS} 
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-colors hover:scale-105 active:scale-95"
            >
                Browse Restaurants
            </Link>
        </div>
    );
};
