import React, { useState } from 'react';
import { useOwnerReviews, useOwnerRestaurants } from '../../hooks/queries/useOwnerQueries';
import { useReplyToReviewMutation } from '../../hooks/mutations/useOwnerMutations';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../contexts/ToastContext';
import { Star, MessageCircle, User } from 'lucide-react';

export const Reviews = () => {
    const { addToast } = useToast();
    const { data: restaurants } = useOwnerRestaurants();
    const [restaurantFilter, setRestaurantFilter] = useState('');
    const { data: reviewsData, isLoading, error } = useOwnerReviews({ 
        restaurant_id: restaurantFilter || undefined 
    });
    
    const replyMutation = useReplyToReviewMutation();
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const handleReply = async (reviewId) => {
        if (!replyText.trim()) return;
        try {
            await replyMutation.mutateAsync({ reviewId, data: { owner_reply: replyText } });
            addToast('Reply posted successfully', 'success');
            setReplyingTo(null);
            setReplyText('');
        } catch (err) {
            addToast('Failed to post reply', 'error');
        }
    };

    if (isLoading) return <PageLoader message="Loading reviews..." />;
    if (error) return <ErrorState message={error.message} />;

    const reviews = reviewsData?.items || reviewsData || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-on-surface">Customer Reviews</h1>
                    <p className="text-on-surface-variant text-sm mt-1">Manage feedback and engage with customers.</p>
                </div>
                
                {restaurants && restaurants.length > 1 && (
                    <div className="w-full md:w-64">
                        <select 
                            value={restaurantFilter} 
                            onChange={(e) => setRestaurantFilter(e.target.value)}
                            className="w-full bg-surface-container border border-surface-container-high rounded-lg px-3 py-2 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm font-bold"
                        >
                            <option value="">All Restaurants</option>
                            {restaurants.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {reviews.length === 0 ? (
                <div className="bg-surface-container-lowest p-12 rounded-xl border border-surface-container-high text-center">
                    <Star className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
                    <p className="text-on-surface font-medium text-lg">No reviews yet</p>
                    <p className="text-on-surface-variant mt-1">Reviews will appear here once customers rate their orders.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex text-status-warning">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-surface-container-high'}`} />
                                            ))}
                                        </div>
                                        <span className="font-bold text-on-surface text-sm">{review.rating}.0</span>
                                    </div>
                                    <div className="text-xs text-on-surface-variant flex items-center gap-2">
                                        <User className="w-3 h-3" />
                                        <span>Customer • {new Date(review.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                {restaurants && (
                                    <span className="text-xs font-bold text-primary uppercase bg-primary-container px-2 py-1 rounded">
                                        {restaurants.find(r => r.id === review.restaurant_id)?.name || 'Restaurant'}
                                    </span>
                                )}
                            </div>
                            
                            {review.comment && (
                                <p className="text-on-surface mb-4">{review.comment}</p>
                            )}

                            {review.owner_reply ? (
                                <div className="mt-4 bg-surface-container-low p-4 rounded-lg border-l-4 border-primary">
                                    <p className="text-xs font-bold text-primary mb-1 flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" /> Your Reply
                                    </p>
                                    <p className="text-sm text-on-surface">{review.owner_reply}</p>
                                </div>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-surface-container-high">
                                    {replyingTo === review.id ? (
                                        <div className="space-y-3">
                                            <textarea 
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write your response to the customer..."
                                                className="w-full bg-surface-container border border-surface-container-high rounded-lg p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[80px]"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button 
                                                    onClick={() => setReplyingTo(null)}
                                                    className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={() => handleReply(review.id)}
                                                    disabled={!replyText.trim() || replyMutation.isPending}
                                                    className="px-4 py-2 text-sm font-bold bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                                                >
                                                    {replyMutation.isPending ? 'Posting...' : 'Post Reply'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setReplyingTo(review.id)}
                                            className="text-sm font-bold text-primary hover:underline flex items-center gap-1.5"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Reply to Review
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
