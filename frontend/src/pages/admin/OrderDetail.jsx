import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAdminOrderDetail } from '../../hooks/queries/useAdminQueries';
import { StatusPill } from '../../components/admin/Shared';
import { ArrowLeft, Clock, MapPin, Store, User, Bike } from 'lucide-react';
import { PageLoader } from '../../components/common/PageLoader';

export const OrderDetail = () => {
    const { id } = useParams();
    const { data: order, isLoading, isError } = useAdminOrderDetail(id);

    if (isLoading) return <PageLoader message="Loading order details..." />;
    if (isError || !order) return <div className="text-center p-8 text-error">Failed to load order details</div>;

    return (
        <div className="space-y-6">
            <Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Orders
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-on-surface flex items-center gap-3">
                        Order <span className="text-primary font-mono text-xl">#{order.id.split('-')[0]}</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-on-surface-variant font-medium">
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(order.created_at).toLocaleString()}</span>
                    </div>
                </div>
                <StatusPill status={order.status} type="order" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Items */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-sm">
                        <h2 className="text-lg font-black mb-4">Order Items</h2>
                        <div className="space-y-4">
                            {order.items?.map((item) => (
                                <div key={item.id} className="flex justify-between items-center pb-4 border-b border-surface-container-high last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${item.menu_item?.is_vegetarian ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <div>
                                            <p className="font-bold text-on-surface">{item.menu_item?.name || 'Unknown Item'}</p>
                                            <p className="text-sm text-on-surface-variant">Qty: {item.quantity} × ₹{item.unit_price}</p>
                                        </div>
                                    </div>
                                    <div className="font-black text-on-surface">₹{(item.quantity * item.unit_price).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-sm">
                        <h2 className="text-lg font-black mb-4">Status History</h2>
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface-container-highest before:to-transparent">
                            {order.status_history?.map((hist, idx) => (
                                <div key={hist.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-4 border-surface-container-lowest bg-primary z-10 shrink-0"></div>
                                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-surface-container-low shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="font-bold text-sm text-on-surface">{hist.status.replace('_', ' ')}</div>
                                            <div className="text-xs font-medium text-on-surface-variant">{new Date(hist.created_at).toLocaleTimeString()}</div>
                                        </div>
                                        {hist.notes && <p className="text-xs text-on-surface-variant">{hist.notes}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-sm">
                        <h2 className="text-lg font-black mb-4">Financials</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-on-surface-variant">Subtotal</span><span className="font-bold">₹{order.subtotal?.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-on-surface-variant">Delivery Fee</span><span className="font-bold">₹{order.delivery_fee?.toFixed(2)}</span></div>
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between text-status-success"><span className="font-bold">Discount</span><span className="font-bold">-₹{order.discount_amount?.toFixed(2)}</span></div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-surface-container-high mt-2 text-base">
                                <span className="font-black text-on-surface">Total</span>
                                <span className="font-black text-primary">₹{order.total_amount?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Entities */}
                    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-sm space-y-4">
                        <h2 className="text-lg font-black mb-2">Entities Involved</h2>
                        
                        <div>
                            <div className="flex items-center gap-2 text-sm font-bold text-on-surface-variant mb-1"><Store className="w-4 h-4"/> Restaurant</div>
                            <div className="bg-surface-container-low p-3 rounded-xl">
                                {order.restaurant ? (
                                    <>
                                        <div className="font-bold text-on-surface">{order.restaurant.name}</div>
                                        <div className="text-xs text-on-surface-variant">ID: {order.restaurant.id}</div>
                                    </>
                                ) : <span className="text-sm italic">Not available</span>}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 text-sm font-bold text-on-surface-variant mb-1"><User className="w-4 h-4"/> Customer</div>
                            <div className="bg-surface-container-low p-3 rounded-xl">
                                {order.customer ? (
                                    <>
                                        <div className="font-bold text-on-surface">{order.customer.first_name} {order.customer.last_name}</div>
                                        <div className="text-xs text-on-surface-variant">ID: {order.customer.id}</div>
                                    </>
                                ) : <span className="text-sm italic">Not available</span>}
                            </div>
                        </div>

                        {order.delivery_partner_id && (
                            <div>
                                <div className="flex items-center gap-2 text-sm font-bold text-on-surface-variant mb-1"><Bike className="w-4 h-4"/> Rider</div>
                                <div className="bg-surface-container-low p-3 rounded-xl">
                                    <div className="font-bold text-on-surface">Assigned ID</div>
                                    <div className="text-xs text-on-surface-variant">{order.delivery_partner_id}</div>
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <div className="flex items-center gap-2 text-sm font-bold text-on-surface-variant mb-1"><MapPin className="w-4 h-4"/> Delivery Address</div>
                            <div className="bg-surface-container-low p-3 rounded-xl text-sm">
                                {order.delivery_address ? (
                                    <>
                                        <p>{order.delivery_address.address}</p>
                                        <p>{order.delivery_address.city}, {order.delivery_address.postal_code}</p>
                                    </>
                                ) : <span className="italic">Not available</span>}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
