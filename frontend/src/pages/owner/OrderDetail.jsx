import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOwnerOrderDetail } from '../../hooks/queries/useOwnerQueries';
import { useUpdateOrderStatusMutation, useAcceptOrderMutation, useRejectOrderMutation } from '../../hooks/mutations/useOwnerMutations';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ORDER_STATUS } from '../../utils/order.utils';
import { useToast } from '../../contexts/ToastContext';
import { ArrowLeft, User, Phone, MapPin } from 'lucide-react';

export const OrderDetail = () => {
    const { id } = useParams();
    const { addToast } = useToast();
    const { data: order, isLoading, error } = useOwnerOrderDetail(id);
    
    const acceptMutation = useAcceptOrderMutation();
    const rejectMutation = useRejectOrderMutation();
    const statusMutation = useUpdateOrderStatusMutation();

    const handleAction = async (action, payload = null) => {
        try {
            if (action === 'accept') {
                await acceptMutation.mutateAsync(order.id);
                addToast('Order accepted', 'success');
            } else if (action === 'reject') {
                const reason = prompt('Reason for rejection:');
                if (!reason) return;
                await rejectMutation.mutateAsync({ orderId: order.id, reason });
                addToast('Order rejected', 'success');
            } else if (action === 'status') {
                await statusMutation.mutateAsync({ orderId: order.id, newStatus: payload });
                addToast('Status updated', 'success');
            }
        } catch (err) {
            addToast(err.message || 'Action failed', 'error');
        }
    };

    if (isLoading) return <PageLoader message="Loading order details..." />;
    if (error) return <ErrorState message={error.message} />;
    if (!order) return <ErrorState message="Order not found" />;

    const isPending = acceptMutation.isPending || rejectMutation.isPending || statusMutation.isPending;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/owner/orders" className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-on-surface flex items-center gap-3">
                        Order #{order.id.substring(0, 8)}
                        <StatusBadge status={order.status} />
                    </h1>
                    <p className="text-on-surface-variant text-sm">Placed on {new Date(order.created_at).toLocaleString()}</p>
                </div>
            </div>

            {/* Actions Bar */}
            {(order.status === ORDER_STATUS.PLACED || order.status === ORDER_STATUS.ACCEPTED || order.status === ORDER_STATUS.PREPARING) && (
                <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high shadow-sm flex flex-wrap gap-3">
                    {order.status === ORDER_STATUS.PLACED && (
                        <>
                            <button disabled={isPending} onClick={() => handleAction('accept')} className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg shadow-sm hover:bg-primary/90">Accept Order</button>
                            <button disabled={isPending} onClick={() => handleAction('reject')} className="px-6 py-2 bg-error-container text-error font-bold rounded-lg hover:bg-error-container/80">Reject Order</button>
                        </>
                    )}
                    {order.status === ORDER_STATUS.ACCEPTED && (
                        <button disabled={isPending} onClick={() => handleAction('status', ORDER_STATUS.PREPARING)} className="px-6 py-2 bg-secondary text-on-secondary font-bold rounded-lg shadow-sm hover:bg-secondary/90">Start Preparing</button>
                    )}
                    {order.status === ORDER_STATUS.PREPARING && (
                        <button disabled={isPending} onClick={() => handleAction('status', ORDER_STATUS.READY_FOR_PICKUP)} className="px-6 py-2 bg-tertiary text-on-tertiary font-bold rounded-lg shadow-sm hover:bg-tertiary/90">Mark Ready for Pickup</button>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-surface-container-high bg-surface-container-low/50">
                            <h2 className="font-bold text-on-surface">Order Items</h2>
                        </div>
                        <div className="divide-y divide-surface-container-high p-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="py-3 flex justify-between">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center font-bold text-on-surface">
                                            {item.quantity}x
                                        </div>
                                        <div>
                                            <p className="font-bold text-on-surface">{item.item_name}</p>
                                            <p className="text-sm text-on-surface-variant">₹{item.unit_price} each</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-on-surface">₹{item.total_price}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-surface-container-low/30 border-t border-surface-container-high space-y-2">
                            <div className="flex justify-between text-sm text-on-surface-variant">
                                <span>Item Total</span>
                                <span>₹{order.subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm text-on-surface-variant">
                                <span>Taxes</span>
                                <span>₹{order.tax_amount}</span>
                            </div>
                            <div className="flex justify-between font-black text-lg text-on-surface pt-2 border-t border-dashed border-surface-container-high">
                                <span>Customer Paid</span>
                                <span>₹{order.total_amount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-4 space-y-4">
                        <h2 className="font-bold text-on-surface border-b border-surface-container-high pb-2">Customer Details</h2>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-on-surface-variant mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-on-surface">{order.customer?.first_name} {order.customer?.last_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-on-surface-variant mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-on-surface">{order.customer?.phone || 'No phone provided'}</p>
                                </div>
                            </div>
                            {order.notes && (
                                <div className="mt-4 p-3 bg-status-warning/10 rounded-lg border border-status-warning/20">
                                    <p className="text-xs font-bold text-status-warning uppercase mb-1">Special Instructions</p>
                                    <p className="text-sm font-medium text-on-surface">{order.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
