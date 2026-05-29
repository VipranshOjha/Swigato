import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { RatingStars } from '../common/RatingStars';
import { Loader2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useSubmitReviewMutation } from '../../hooks/mutations/useReviewMutations';

export const ReviewPromptModal = ({ isOpen, onClose, orderId, restaurantName, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const { addToast } = useToast();
    
    const submitReviewMutation = useSubmitReviewMutation();
    const isLoading = submitReviewMutation.isPending;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            addToast('Please select a rating', 'warning');
            return;
        }

        submitReviewMutation.mutate({
            order_id: orderId,
            rating,
            comment: comment.trim() || undefined
        }, {
            onSuccess: () => {
                addToast('Thank you for your review!', 'success');
                if (onSuccess) onSuccess();
                onClose();
            },
            onError: (error) => {
                addToast(error.message || 'Failed to submit review', 'error');
            }
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="How was your food?">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-2">
                <p className="text-body-md text-on-surface-variant">
                    Rate your recent order from <span className="font-bold text-on-surface">{restaurantName}</span>
                </p>
                
                <div className="flex flex-col items-center gap-4 py-4">
                    <RatingStars 
                        rating={rating} 
                        onRate={setRating} 
                        isInteractive={true} 
                        size="xl" 
                    />
                    <span className="text-sm font-medium text-on-surface-variant">
                        {rating === 0 ? 'Select a rating' : `${rating} out of 5 stars`}
                    </span>
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="comment" className="text-sm font-medium text-on-surface">
                        Add a comment (Optional)
                    </label>
                    <textarea 
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What did you like or dislike?"
                        className="w-full p-3 border border-surface-container-high rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] resize-y bg-surface-container-lowest"
                    />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                        disabled={isLoading}
                    >
                        Skip
                    </button>
                    <button 
                        type="submit"
                        disabled={isLoading || rating === 0}
                        className="px-6 py-2.5 rounded-lg font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Review'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
