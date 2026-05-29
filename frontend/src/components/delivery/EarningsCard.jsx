import React from 'react';

export const EarningsCard = ({ title, value, icon: Icon, color = 'text-primary', subtitle }) => (
    <div className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container-high shadow-sm flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{title}</span>
            {Icon && <Icon className={`w-5 h-5 ${color}`} />}
        </div>
        <div>
            <div className={`text-3xl font-black ${color}`}>{value}</div>
            {subtitle && <p className="text-xs text-on-surface-variant mt-1">{subtitle}</p>}
        </div>
    </div>
);
