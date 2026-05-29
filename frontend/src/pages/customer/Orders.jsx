import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrders } from '../../hooks/queries/useOrderQueries';
import { useCartActions } from '../../hooks/actions/useCartActions';
import { OrderSkeleton } from '../../components/skeletons';
import { OrderStatusBadge } from '../../components/order/OrderStatusBadge';
import { EmptyOrdersState } from '../../components/order/EmptyOrdersState';
import { ErrorState } from '../../components/common/ErrorState';
import { ReviewPromptModal } from '../../components/customer/ReviewPromptModal';
import { normalizePaginatedResponse } from '../../utils/api.utils';
import { ORDER_STATUS } from '../../utils/orderStatus.utils';
import { Clock, ChevronRight, RotateCcw, Star } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const Orders = () => {
    const { data, isLoading, error, refetch } = useOrders({ limit: 20 });
    const { addItem, clearCart } = useCartActions();
    const navigate = useNavigate();
    const [reviewOrderId, setReviewOrderId] = useState(null);

    const ordersData = normalizePaginatedResponse(data);

    const handleReorder = async (e, order) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!window.confirm('This will clear your current cart and add items from this order. Continue?')) {
            return;
        }

        try {
            await clearCart();
            // Need to sequence the adds or handle it via a batch if API supported it.
            // For now, optimistic UI handles it smoothly.
            for (const item of order.items) {
                // Mock checking if item is still available could happen here
                // We assume available for this MVP, or backend throws on place_order.
                addItem({
                    id: item.menu_item_id,
                    name: item.name,
                    price: item.price_at_time || item.price,
                    restaurant_id: order.restaurant_id,
                    is_veg: true // mock fallback
                }, item.quantity);
            }
            navigate(ROUTES.CART);
        } catch (err) {
            console.error('Failed to reorder', err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-display-sm font-black text-on-surface mb-8">Your Orders</h1>

            {error ? (
                <ErrorState title="Failed to load orders" message={error.message || error} onRetry={() => refetch()} />
            ) : isLoading ? (
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => <OrderSkeleton key={i} />)}
                </div>
            ) : ordersData.items.length === 0 ? (
                <EmptyOrdersState />
            ) : (
                <div className="space-y-4">
                    {ordersData.items.map(order => (
                        <Link 
                            key={order.id} 
                            to={`/orders/${order.id}`}
                            onMouseEnter={() => import('./OrderDetail')}
                            className="block bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high shadow-sm hover:border-primary/30 transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-title-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                                        Restaurant ID: {order.restaurant_id} {/* In reality, we'd want the restaurant name here from the backend */}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{new Date(order.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-lg text-on-surface">₹{order.total_amount?.toFixed(2)}</p>
                                    <OrderStatusBadge status={order.status} className="mt-1" />
                                </div>
                            </div>
                            
                            <div className="border-t border-surface-container-high pt-4 flex justify-between items-center">
                                <div className="text-sm text-on-surface-variant line-clamp-1 flex-1 pr-4">
                                    {order.items?.map(item => `${item.quantity}x ${item.name || 'Item'}`).join(', ')}
                                </div>
                                
                                <div className="flex gap-2">
                                    {order.status === ORDER_STATUS.DELIVERED && (
                                        <button 
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReviewOrderId(order.id); }}
                                            className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-primary bg-surface-container hover:bg-primary-container px-3 py-2 rounded-lg transition-colors"
                                        >
                                            <Star className="w-4 h-4" />
                                            <span className="hidden sm:inline">Rate</span>
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => handleReorder(e, order)}
                                        className="flex items-center gap-1.5 text-sm font-bold text-primary bg-primary/10 hover:bg-primary hover:text-on-primary px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        <span className="hidden sm:inline">Reorder</span>
                                    </button>
                                    <div className="flex items-center gap-1 text-on-surface-variant font-bold text-sm bg-surface-container px-3 py-2 rounded-lg group-hover:bg-surface-container-high transition-colors">
                                        <span className="hidden sm:inline">Details</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {reviewOrderId && (
                <ReviewPromptModal 
                    isOpen={!!reviewOrderId}
                    onClose={() => setReviewOrderId(null)}
                    orderId={reviewOrderId}
                    restaurantName="Restaurant"
                />
            )}
        </div>
    );
};
