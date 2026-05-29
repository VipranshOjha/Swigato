import React, { useState } from 'react';
import { useAdminOrders } from '../../hooks/queries/useAdminQueries';
import { AdminTable, StatusPill } from '../../components/admin/Shared';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { useRealtime } from '../../hooks/useRealtime';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/react-query/queryKeys';

export const Orders = () => {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');

    const { data, isLoading } = useAdminOrders({ 
        page, 
        page_size: 15,
        ...(statusFilter ? { status: statusFilter } : {})
    });

    const queryClient = useQueryClient();
    useRealtime(
        'admin:system',
        [
            'ORDER_CREATED', 'ORDER_ACCEPTED', 'ORDER_REJECTED', 
            'ORDER_PREPARING', 'ORDER_READY_FOR_PICKUP', 
            'RIDER_ASSIGNED', 'ORDER_PICKED_UP', 'ORDER_IN_TRANSIT', 'ORDER_DELIVERED'
        ],
        () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders.lists() });
        }
    );

    const columns = [
        { 
            header: 'Order ID', 
            accessor: (row) => (
                <div className="font-bold text-on-surface text-xs font-mono">
                    {row.id.split('-')[0]}...
                </div>
            )
        },
        { 
            header: 'Date', 
            accessor: (row) => <div className="text-sm text-on-surface-variant">{new Date(row.created_at).toLocaleString()}</div> 
        },
        { 
            header: 'Amount', 
            accessor: (row) => <div className="font-bold text-on-surface">₹{row.total_amount.toFixed(2)}</div> 
        },
        { 
            header: 'Status', 
            accessor: (row) => <StatusPill status={row.status} type="order" />
        },
        { 
            header: 'Payment', 
            accessor: (row) => <span className="text-sm font-bold text-on-surface-variant uppercase">{row.payment_mode}</span>
        },
        {
            header: '',
            accessor: (row) => (
                <Link to={`/admin/orders/${row.id}`} className="p-2 inline-flex bg-surface-container hover:bg-surface-container-high rounded-lg text-primary transition-colors">
                    <Eye className="w-4 h-4" />
                </Link>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-on-surface">Orders</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Platform-wide order oversight.</p>
                </div>
                <select 
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="bg-surface-container border border-surface-container-high rounded-lg px-4 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="PLACED">Placed</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                    <option value="RIDER_ASSIGNED">Rider Assigned</option>
                    <option value="PICKED_UP">Picked Up</option>
                    <option value="DELIVERING">Delivering</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            <AdminTable 
                columns={columns} 
                data={data?.items || []} 
                isLoading={isLoading} 
                pagination={{
                    page,
                    pageSize: 15,
                    total: data?.total || 0,
                    onPageChange: setPage
                }}
            />
        </div>
    );
};
