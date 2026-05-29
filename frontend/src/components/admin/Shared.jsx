import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const StatCard = ({ title, value, icon: Icon, colorClass = "text-primary", subtitle }) => (
    <div className="bg-surface-container-lowest p-6 rounded-2xl border-2 border-surface-container-high shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-on-surface-variant font-bold text-sm uppercase tracking-wider">{title}</h3>
            {Icon && <div className={`p-2 bg-surface-container rounded-xl ${colorClass}`}><Icon className="w-5 h-5" /></div>}
        </div>
        <div className="text-3xl font-black text-on-surface mb-1">{value}</div>
        {subtitle && <p className="text-sm font-medium text-on-surface-variant">{subtitle}</p>}
    </div>
);

export const StatusPill = ({ status, type = 'default' }) => {
    let styles = "bg-surface-container text-on-surface";
    const statusText = (status || '').toUpperCase();

    if (type === 'approval') {
        if (statusText === 'APPROVED') styles = "bg-status-success/20 text-status-success";
        else if (statusText === 'PENDING_APPROVAL') styles = "bg-status-warning/20 text-status-warning";
        else if (statusText === 'REJECTED') styles = "bg-error-container text-error";
        else if (statusText === 'SUSPENDED') styles = "bg-surface-container-highest text-on-surface";
    } else if (type === 'order') {
        if (['DELIVERED', 'COMPLETED'].includes(statusText)) styles = "bg-status-success/20 text-status-success";
        else if (['PENDING', 'AWAITING_PAYMENT'].includes(statusText)) styles = "bg-status-warning/20 text-status-warning";
        else if (['CANCELLED', 'REJECTED', 'PAYMENT_FAILED'].includes(statusText)) styles = "bg-error-container text-error";
        else styles = "bg-primary-container text-primary"; // Active states
    } else if (type === 'payment') {
        if (statusText === 'CAPTURED') styles = "bg-status-success/20 text-status-success";
        else if (statusText === 'FAILED') styles = "bg-error-container text-error";
        else if (statusText === 'REFUNDED') styles = "bg-surface-container-highest text-on-surface";
        else styles = "bg-status-warning/20 text-status-warning";
    }

    return (
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase ${styles}`}>
            {statusText.replace('_', ' ')}
        </span>
    );
};

export const AdminTable = ({ columns, data, isLoading, pagination }) => {
    return (
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto hide-scrollbar">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                        <tr className="bg-surface-container-low border-b border-surface-container-high">
                            {columns.map((col, i) => (
                                <th key={i} className="px-6 py-4 text-xs font-black text-on-surface-variant uppercase tracking-wider">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                                    <div className="animate-pulse flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        Loading data...
                                    </div>
                                </td>
                            </tr>
                        ) : data?.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                                    No records found matching the criteria.
                                </td>
                            </tr>
                        ) : (
                            data?.map((row, i) => (
                                <tr key={row.id || i} className="hover:bg-surface-container-lowest/50 transition-colors">
                                    {columns.map((col, j) => (
                                        <td key={j} className="px-6 py-4 align-middle">
                                            {col.accessor ? col.accessor(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {pagination && (
                <div className="px-6 py-4 border-t border-surface-container-high bg-surface-container-low flex justify-between items-center">
                    <span className="text-sm font-medium text-on-surface-variant">
                        Showing page <span className="text-on-surface font-bold">{pagination.page}</span> of {Math.ceil(pagination.total / pagination.pageSize) || 1}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            disabled={pagination.page <= 1 || isLoading}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            className="p-2 rounded-lg border border-surface-container-high text-on-surface hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                            disabled={pagination.page * pagination.pageSize >= pagination.total || isLoading}
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            className="p-2 rounded-lg border border-surface-container-high text-on-surface hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
