import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from './Toast'; // Using the cn utility from Toast.jsx

export const RatingStars = ({ 
    rating = 0, 
    max = 5, 
    isInteractive = false, 
    onRate, 
    size = 'md' 
}) => {
    const [hoverRating, setHoverRating] = useState(0);

    const sizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8'
    };

    const iconSize = sizes[size] || sizes.md;
    const currentRating = hoverRating || rating;

    return (
        <div className="flex items-center gap-1">
            {[...Array(max)].map((_, i) => {
                const starValue = i + 1;
                const isFilled = starValue <= currentRating;
                
                return (
                    <button
                        key={i}
                        type="button"
                        disabled={!isInteractive}
                        className={cn(
                            "transition-colors",
                            !isInteractive && "cursor-default",
                            isInteractive && "hover:scale-110",
                            isFilled ? "text-primary" : "text-surface-dim"
                        )}
                        onMouseEnter={() => isInteractive && setHoverRating(starValue)}
                        onMouseLeave={() => isInteractive && setHoverRating(0)}
                        onClick={() => isInteractive && onRate && onRate(starValue)}
                    >
                        <Star className={cn(iconSize, isFilled && "fill-current")} />
                    </button>
                );
            })}
        </div>
    );
};
