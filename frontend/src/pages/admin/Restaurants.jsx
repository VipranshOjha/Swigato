import React, { useState } from 'react';
import { useAdminRestaurants } from '../../hooks/queries/useAdminQueries';
import { useApproveRestaurantMutation, useRejectRestaurantMutation, useSuspendRestaurantMutation, useActivateRestaurantMutation } from '../../hooks/mutations/useAdminMutations';
import { AdminTable, StatusPill } from '../../components/admin/Shared';
import { useToast } from '../../contexts/ToastContext';

export const Restaurants = () => {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const { addToast } = useToast();

    const { data, isLoading } = useAdminRestaurants({ 
        page, 
        page_size: 10,
        ...(statusFilter ? { status: statusFilter } : {})
    });

    const approveMutation = useApproveRestaurantMutation();
    const rejectMutation = useRejectRestaurantMutation();
    const suspendMutation = useSuspendRestaurantMutation();
    const activateMutation = useActivateRestaurantMutation();

    const handleAction = async (id, action) => {
        try {
            if (action === 'approve') {
                await approveMutation.mutateAsync(id);
                addToast('Restaurant approved', 'success');
            } else if (action === 'reject') {
                const reason = prompt('Reason for rejection:');
                if (!reason) return;
                await rejectMutation.mutateAsync({ id, reason });
                addToast('Restaurant rejected', 'success');
            } else if (action === 'suspend') {
                if (window.confirm('Are you sure you want to suspend this restaurant?')) {
                    await suspendMutation.mutateAsync(id);
                    addToast('Restaurant suspended', 'success');
                }
            } else if (action === 'activate') {
                await activateMutation.mutateAsync(id);
                addToast('Restaurant activated', 'success');
            }
        } catch (err) {
            addToast(err.message || 'Action failed', 'error');
        }
    };

    const columns = [
        { 
            header: 'Restaurant', 
            accessor: (row) => (
                <div>
                    <div className="font-bold text-on-surface">{row.name}</div>
                    <div className="text-xs text-on-surface-variant">{row.city}, {row.state}</div>
                </div>
            )
        },
        { 
            header: 'Contact', 
            accessor: (row) => (
                <div className="text-sm">
                    <div className="text-on-surface">{row.email}</div>
                    <div className="text-on-surface-variant">{row.phone}</div>
                </div>
            ) 
        },
        { 
            header: 'Status', 
            accessor: (row) => <StatusPill status={row.approval_status} type="approval" />
        },
        {
            header: 'Joined',
            accessor: (row) => <span className="text-sm text-on-surface-variant">{new Date(row.created_at).toLocaleDateString()}</span>
        },
        {
            header: 'Actions',
            accessor: (row) => {
                const isPending = approveMutation.isPending || rejectMutation.isPending || suspendMutation.isPending || activateMutation.isPending;
                return (
                    <div className="flex gap-2">
                        {row.approval_status === 'PENDING_APPROVAL' && (
                            <>
                                <button disabled={isPending} onClick={() => handleAction(row.id, 'approve')} className="px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded hover:bg-primary/90">Approve</button>
                                <button disabled={isPending} onClick={() => handleAction(row.id, 'reject')} className="px-3 py-1 bg-error-container text-error text-xs font-bold rounded hover:bg-error-container/80">Reject</button>
                            </>
                        )}
                        {row.approval_status === 'APPROVED' && (
                            <button disabled={isPending} onClick={() => handleAction(row.id, 'suspend')} className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded hover:bg-surface-container-highest">Suspend</button>
                        )}
                        {row.approval_status === 'SUSPENDED' && (
                            <button disabled={isPending} onClick={() => handleAction(row.id, 'activate')} className="px-3 py-1 bg-secondary text-on-secondary text-xs font-bold rounded hover:bg-secondary/90">Activate</button>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-on-surface">Restaurants</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Manage restaurant approvals and suspensions.</p>
                </div>
                <select 
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="bg-surface-container border border-surface-container-high rounded-lg px-4 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="APPROVED">Approved</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            <AdminTable 
                columns={columns} 
                data={data?.items || []} 
                isLoading={isLoading} 
                pagination={{
                    page,
                    pageSize: 10,
                    total: data?.total || 0,
                    onPageChange: setPage
                }}
            />
        </div>
    );
};
