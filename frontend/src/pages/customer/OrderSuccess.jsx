import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLoader } from '../../components/common/PageLoader';
import { CheckCircle2, Navigation, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const OrderSuccess = () => {
    const { id } = useParams();

    return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center animate-in slide-in-from-bottom-8 fade-in duration-500">
            <div className="w-24 h-24 bg-status-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-status-success" />
            </div>
            
            <h1 className="text-display-sm font-black text-on-surface mb-2">Order Confirmed!</h1>
            <p className="text-body-lg text-on-surface-variant mb-8">
                Your order #{id.slice(0, 8).toUpperCase()} has been placed successfully.
            </p>
            
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high shadow-sm mb-8">
                <div className="flex items-center justify-center gap-3 text-sm font-bold text-on-surface mb-2">
                    <Navigation className="w-5 h-5 text-primary" />
                    Tracking is Live
                </div>
                <p className="text-sm text-on-surface-variant">
                    We've sent the order to the restaurant and are assigning a delivery partner.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                    to={`/orders/${id}`} 
                    className="flex-1 px-6 py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    Track Order
                    <ArrowRight className="w-5 h-5" />
                </Link>
                <Link 
                    to={ROUTES.HOME} 
                    className="flex-1 px-6 py-4 bg-surface-container text-on-surface font-bold rounded-xl shadow-sm hover:bg-surface-container-high transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
};
