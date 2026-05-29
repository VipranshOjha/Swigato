import React, { useState } from 'react';
import { useAdminReviews } from '../../hooks/queries/useAdminQueries';
import { useModerateReviewMutation } from '../../hooks/mutations/useAdminMutations';
import { AdminTable } from '../../components/admin/Shared';
import { useToast } from '../../contexts/ToastContext';
import { Star } from 'lucide-react';

export const Reviews = () => {
    const [page, setPage] = useState(1);
    const { addToast } = useToast();

    const { data, isLoading } = useAdminReviews({ page, page_size: 15 });
    const moderateMutation = useModerateReviewMutation();

    const handleModerate = async (id, action) => {
        try {
            await moderateMutation.mutateAsync({ id, action });
            addToast(`Review ${action === 'hide' ? 'hidden' : 'restored'} successfully`, 'success');
        } catch (err) {
            addToast(err.message || 'Action failed', 'error');
        }
    };

    const columns = [
        { 
            header: 'Rating', 
            accessor: (row) => (
                <div className="flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded w-fit">
                    <span className="font-bold text-on-surface text-sm">{row.rating}</span>
                    <Star className="w-3 h-3 text-primary fill-primary" />
                </div>
            )
        },
        { 
            header: 'Review', 
            accessor: (row) => (
                <div className="max-w-xs md:max-w-md">
                    {row.title && <div className="font-bold text-sm text-on-surface mb-1">{row.title}</div>}
                    <div className="text-sm text-on-surface-variant truncate">{row.comment}</div>
                </div>
            ) 
        },
        { 
            header: 'Restaurant', 
            accessor: (row) => (
                <div className="text-sm font-mono text-on-surface-variant">
                    {row.restaurant_id.split('-')[0]}...
                </div>
            )
        },
        { 
            header: 'Status', 
            accessor: (row) => (
                row.is_hidden 
                    ? <span className="px-2 py-1 bg-error-container text-error text-[10px] font-black rounded uppercase">Hidden</span>
                    : <span className="px-2 py-1 bg-status-success/20 text-status-success text-[10px] font-black rounded uppercase">Visible</span>
            )
        },
        {
            header: 'Actions',
            accessor: (row) => {
                const isPending = moderateMutation.isPending;
                return (
                    <div className="flex gap-2">
                        {row.is_hidden ? (
                            <button disabled={isPending} onClick={() => handleModerate(row.id, 'restore')} className="px-3 py-1 bg-surface-container-high text-on-surface text-xs font-bold rounded hover:bg-surface-container-highest">Restore</button>
                        ) : (
                            <button disabled={isPending} onClick={() => handleModerate(row.id, 'hide')} className="px-3 py-1 bg-error-container text-error text-xs font-bold rounded hover:bg-error-container/80">Hide</button>
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
                    <h1 className="text-2xl font-black text-on-surface">Reviews</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Platform-wide review moderation.</p>
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
