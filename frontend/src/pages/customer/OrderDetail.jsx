import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrderTracking } from '../../hooks/queries/useOrderTracking';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { OrderStatusBadge } from '../../components/order/OrderStatusBadge';
import { OrderTimeline } from '../../components/order/OrderTimeline';
import { OrderPriceBreakdown } from '../../components/order/OrderPriceBreakdown';
import { RestaurantMetaCard } from '../../components/order/RestaurantMetaCard';
import { DeliveryETA } from '../../components/order/DeliveryETA';
import { ReviewPromptModal } from '../../components/customer/ReviewPromptModal';
import { ORDER_STATUS } from '../../utils/orderStatus.utils';
import { ChevronLeft, Receipt, Bike, Star, AlertCircle } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const OrderDetail = () => {
    const { id } = useParams();
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    
    const { 
        data: order, 
        isLoading, 
        error, 
        refetch,
        isFetching
    } = useOrderTracking(id);

    if (isLoading) return <PageLoader text="Loading order details..." />;
    if (error) return (
        <div className="max-w-3xl mx-auto p-4 py-8">
            <ErrorState title="Order not found" message={error.message || error} onRetry={() => refetch()} />
        </div>
    );
    if (!order) return null;

    const isDelivered = order.status === ORDER_STATUS.DELIVERED;
    // Determine if we show review button (delivered and no review exists - backend would ideally flag this, but we'll show it if delivered)

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <Link to={ROUTES.ORDERS} className="inline-flex items-center gap-2 text-primary font-bold hover:underline mb-6">
                <ChevronLeft className="w-4 h-4" />
                Back to Orders
            </Link>

            {/* Live Polling Indicator */}
            {isFetching && !isLoading && (
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary mb-4 bg-primary/5 py-1.5 rounded-full w-max mx-auto px-4">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Live Sync
                </div>
            )}

            <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-sm overflow-hidden mb-6">
                <div className="p-6 border-b border-surface-container-high flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low/50">
                    <div>
                        <h1 className="text-headline-sm font-black text-on-surface mb-1 flex items-center gap-3">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                            <OrderStatusBadge status={order.status} />
                        </h1>
                        <p className="text-sm text-on-surface-variant">
                            Placed on {new Date(order.created_at).toLocaleString()}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        {isDelivered && (
                            <button 
                                onClick={() => setIsReviewModalOpen(true)}
                                className="flex items-center gap-1.5 text-sm font-bold text-primary bg-primary/10 hover:bg-primary hover:text-on-primary px-4 py-2 rounded-xl transition-colors shadow-sm"
                            >
                                <Star className="w-4 h-4" />
                                Rate Order
                            </button>
                        )}
                    </div>
                </div>

                <OrderTimeline currentStatus={order.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Col: Details & Bill */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-sm p-6">
                        <h3 className="text-title-md font-bold flex items-center gap-2 text-on-surface mb-6 border-b border-surface-container-high pb-4">
                            <Receipt className="w-5 h-5 text-on-surface-variant" />
                            Order Items
                        </h3>
                        <div className="space-y-4 mb-6">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <div className="flex gap-2">
                                            <span className="font-bold text-on-surface">{item.quantity}x</span>
                                            <span className="text-on-surface-variant">{item.name || 'Item'}</span>
                                        </div>
                                        <span className="font-medium text-on-surface">
                                            ₹{(item.price_at_time || item.price || 0) * item.quantity}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <OrderPriceBreakdown 
                            itemTotal={order.total_amount - (order.delivery_fee || 50) - (order.taxes || 0)}
                            deliveryFee={order.delivery_fee || 50}
                            taxes={order.taxes || 0}
                            totalAmount={order.total_amount}
                            isPaid={true}
                        />
                    </div>

                {/* Right Col: Tracking Info */}
                <div className="md:col-span-1 space-y-6">
                    <DeliveryETA status={order.status} createdAt={order.created_at} />

                    <RestaurantMetaCard 
                        restaurant={{
                            id: order.restaurant_id,
                            name: `Restaurant #${order.restaurant_id.slice(0, 4)}`, // Fallback since actual name isn't on order obj
                            // Ideally, order API returns restaurant_name or we fetch it
                        }} 
                    />

                    {order.delivery_partner_id ? (
                        <div className="bg-surface-container-lowest p-5 border border-surface-container-high rounded-2xl shadow-sm">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-on-surface mb-3 border-b border-surface-container-high pb-2">
                                <Bike className="w-4 h-4 text-primary" />
                                Delivery Partner
                            </h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-on-surface">Partner Assigned</p>
                                    <p className="text-xs text-on-surface-variant">ID: {order.delivery_partner_id.slice(0, 8)}</p>
                                </div>
                                <div className="w-10 h-10 bg-primary-container text-primary rounded-full flex items-center justify-center">
                                    <Bike className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    ) : !isDelivered && order.status !== ORDER_STATUS.CANCELLED && (
                        <div className="bg-surface-container-low p-5 rounded-2xl text-center border border-dashed border-surface-container-highest">
                            <Bike className="w-8 h-8 text-on-surface-variant/50 mx-auto mb-2" />
                            <p className="font-bold text-on-surface-variant text-sm">Assigning Partner...</p>
                            <p className="text-xs text-on-surface-variant mt-1">We're looking for nearby delivery partners.</p>
                        </div>
                    )}

                    {order.status === ORDER_STATUS.CANCELLED && (
                        <div className="bg-error-container p-5 rounded-2xl flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-error mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-error text-sm mb-1">Refund Status</h3>
                                <p className="text-xs text-on-error-container">If you were charged, a refund has been initiated and will reflect in 3-5 business days.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {isDelivered && (
                <ReviewPromptModal 
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    orderId={order.id}
                    restaurantName={`Restaurant #${order.restaurant_id.slice(0, 4)}`}
                />
            )}
        </div>
    );
};
