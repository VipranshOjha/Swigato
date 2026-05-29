import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from './Toast';

export const SearchBar = ({ 
    value, 
    onChange, 
    placeholder = "Search...", 
    className,
    delay = 300
}) => {
    const [localValue, setLocalValue] = useState(value || '');

    useEffect(() => {
        setLocalValue(value || '');
    }, [value]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (onChange && localValue !== value) {
                onChange(localValue);
            }
        }, delay);

        return () => clearTimeout(handler);
    }, [localValue, onChange, delay, value]);

    const handleClear = () => {
        setLocalValue('');
        if (onChange) onChange('');
    };

    return (
        <div className={cn("relative flex items-center", className)}>
            <div className="absolute left-4 text-on-surface-variant pointer-events-none">
                <Search className="w-5 h-5" />
            </div>
            <input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-12 pr-10 py-3 bg-surface-container-lowest border border-surface-container-high rounded-full outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface transition-shadow"
            />
            {localValue && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 p-1.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};
