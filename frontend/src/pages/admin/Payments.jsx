import React, { useState } from 'react';
import { useAdminPayments } from '../../hooks/queries/useAdminQueries';
import { AdminTable, StatusPill } from '../../components/admin/Shared';
import { Link } from 'react-router-dom';

export const Payments = () => {
    const [page, setPage] = useState(1);

    const { data, isLoading } = useAdminPayments({ page, page_size: 15 });

    const columns = [
        { 
            header: 'Payment ID', 
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
            header: 'Order', 
            accessor: (row) => (
                <Link to={`/admin/orders/${row.order_id}`} className="text-sm font-bold text-primary hover:underline font-mono">
                    {row.order_id.split('-')[0]}...
                </Link>
            ) 
        },
        { 
            header: 'Amount', 
            accessor: (row) => <div className="font-bold text-on-surface">₹{row.amount.toFixed(2)}</div> 
        },
        { 
            header: 'Gateway', 
            accessor: (row) => (
                <div>
                    <div className="text-sm font-bold text-on-surface uppercase">{row.gateway}</div>
                    {row.gateway_payment_id && <div className="text-xs text-on-surface-variant font-mono mt-0.5">{row.gateway_payment_id}</div>}
                </div>
            )
        },
        { 
            header: 'Status', 
            accessor: (row) => <StatusPill status={row.status} type="payment" />
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-on-surface">Payments</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Platform-wide transaction history.</p>
                </div>
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
