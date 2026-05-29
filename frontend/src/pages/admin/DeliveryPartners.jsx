import React, { useState } from 'react';
import { useAdminDeliveryPartners } from '../../hooks/queries/useAdminQueries';
import { useVerifyDeliveryPartnerMutation, useSuspendDeliveryPartnerMutation } from '../../hooks/mutations/useAdminMutations';
import { AdminTable } from '../../components/admin/Shared';
import { useToast } from '../../contexts/ToastContext';
import { ShieldCheck, ShieldAlert, Bike, Bed } from 'lucide-react';

export const DeliveryPartners = () => {
    const [page, setPage] = useState(1);
    const { addToast } = useToast();

    const { data, isLoading } = useAdminDeliveryPartners({ page, page_size: 10 });
    const verifyMutation = useVerifyDeliveryPartnerMutation();
    const suspendMutation = useSuspendDeliveryPartnerMutation();

    const handleVerify = async (id, verify) => {
        try {
            await verifyMutation.mutateAsync({ id, verify });
            addToast(`Partner ${verify ? 'verified' : 'unverified'} successfully`, 'success');
        } catch (err) {
            addToast(err.message || 'Action failed', 'error');
        }
    };

    const handleSuspend = async (id, suspend) => {
        try {
            await suspendMutation.mutateAsync({ id, suspend });
            addToast(`Partner ${suspend ? 'suspended' : 'unsuspended'} successfully`, 'success');
        } catch (err) {
            addToast(err.message || 'Action failed', 'error');
        }
    };

    const columns = [
        { 
            header: 'Partner ID', 
            accessor: (row) => (
                <div className="font-bold text-on-surface text-xs font-mono">
                    {row.id.split('-')[0]}...
                </div>
            )
        },
        { 
            header: 'Contact', 
            accessor: (row) => (
                <div className="text-sm font-medium text-on-surface">
                    {row.phone}
                </div>
            ) 
        },
        { 
            header: 'State', 
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    {row.is_online ? (
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-primary-container text-primary rounded-md"><Bike className="w-3 h-3" /> ONLINE</span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-surface-container text-on-surface-variant rounded-md"><Bed className="w-3 h-3" /> OFFLINE</span>
                    )}
                </div>
            )
        },
        { 
            header: 'Verification', 
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    {row.is_verified ? (
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-status-success/20 text-status-success rounded-md"><ShieldCheck className="w-3 h-3" /> VERIFIED</span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-status-warning/20 text-status-warning rounded-md"><ShieldAlert className="w-3 h-3" /> PENDING</span>
                    )}
                </div>
            )
        },
        {
            header: 'Actions',
            accessor: (row) => {
                const isPending = verifyMutation.isPending || suspendMutation.isPending;
                return (
                    <div className="flex gap-2">
                        {row.is_verified ? (
                            <button disabled={isPending} onClick={() => handleVerify(row.id, false)} className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded hover:bg-surface-container-highest">Revoke</button>
                        ) : (
                            <button disabled={isPending} onClick={() => handleVerify(row.id, true)} className="px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded hover:bg-primary/90">Verify</button>
                        )}
                        {row.is_suspended ? (
                            <button disabled={isPending} onClick={() => handleSuspend(row.id, false)} className="px-3 py-1 bg-secondary text-on-secondary text-xs font-bold rounded hover:bg-secondary/90">Unsuspend</button>
                        ) : (
                            <button disabled={isPending} onClick={() => handleSuspend(row.id, true)} className="px-3 py-1 bg-error-container text-error text-xs font-bold rounded hover:bg-error-container/80">Suspend</button>
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
                    <h1 className="text-2xl font-black text-on-surface">Delivery Partners</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Manage rider fleet and verifications.</p>
                </div>
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
