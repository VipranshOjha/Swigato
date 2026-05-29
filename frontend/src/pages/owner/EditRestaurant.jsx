import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOwnerRestaurantDetail } from '../../hooks/queries/useOwnerQueries';
import { useUpdateRestaurantMutation } from '../../hooks/mutations/useOwnerMutations';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../contexts/ToastContext';
import { ArrowLeft, Save } from 'lucide-react';

export const EditRestaurant = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    
    const { data: restaurant, isLoading, error } = useOwnerRestaurantDetail(id);
    const updateMutation = useUpdateRestaurantMutation();
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        address: '',
        city: '',
        cuisine_types: '',
        delivery_time_minutes: 30,
        minimum_order_value: 0,
        cover_image_url: '',
    });

    useEffect(() => {
        if (restaurant) {
            setFormData({
                name: restaurant.name || '',
                description: restaurant.description || '',
                address: restaurant.address || '',
                city: restaurant.city || '',
                cuisine_types: Array.isArray(restaurant.cuisine_types) 
                    ? restaurant.cuisine_types.join(', ') 
                    : (restaurant.cuisine_types || ''),
                delivery_time_minutes: restaurant.delivery_time_minutes || 30,
                minimum_order_value: restaurant.minimum_order_value || 0,
                cover_image_url: restaurant.cover_image_url || '',
            });
        }
    }, [restaurant]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...formData,
                cuisine_types: formData.cuisine_types.split(',').map(s => s.trim()).filter(Boolean)
            };
            await updateMutation.mutateAsync({ id, data: submitData });
            addToast('Restaurant details updated', 'success');
            navigate('/owner/restaurants');
        } catch (err) {
            addToast('Failed to update details', 'error');
        }
    };

    if (isLoading) return <PageLoader message="Loading restaurant details..." />;
    if (error) return <ErrorState message={error.message} />;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/owner/restaurants" className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-on-surface">Edit Restaurant</h1>
                    <p className="text-on-surface-variant text-sm">Update your public profile details.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-6 space-y-6">
                <div className="space-y-4">
                    <h2 className="font-bold text-lg text-on-surface border-b border-surface-container-high pb-2">Basic Information</h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1">Restaurant Name</label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            required 
                            className="w-full bg-surface-container border border-surface-container-high rounded-lg px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1">Description</label>
                        <textarea 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            rows="3" 
                            className="w-full bg-surface-container border border-surface-container-high rounded-lg px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1">Cuisine Types (comma separated)</label>
                        <input 
                            type="text" 
                            name="cuisine_types" 
                            value={formData.cuisine_types} 
                            onChange={handleChange} 
                            placeholder="e.g. Italian, Fast Food, Desserts"
                            className="w-full bg-surface-container border border-surface-container-high rounded-lg px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1">Cover Image URL</label>
                        <input 
                            type="url" 
                            name="cover_image_url" 
                            value={formData.cover_image_url} 
                            onChange={handleChange} 
                            placeholder="https://example.com/image.jpg"
                            className="w-full bg-surface-container border border-surface-container-high rounded-lg px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="font-bold text-lg text-on-surface border-b border-surface-container-high pb-2">Location & Operations</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1">City</label>
                            <input 
                                type="text" 
                                name="city" 
                                value={formData.city} 
                                onChange={handleChange} 
                                required 
                                className="w-full bg-surface-container border border-surface-container-high rounded-lg px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1">Full Address</label>
                            <input 
                                type="text" 
                                name="address" 
                                value={formData.address} 
                                onChange={handleChange} 
                                required 
                                className="w-full bg-surface-container border border-surface-container-high rounded-lg px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1">Est. Delivery Time (minutes)</label>
                            <input 
                                type="number" 
                                name="delivery_time_minutes" 
                                value={formData.delivery_time_minutes} 
                                onChange={handleChange} 
                                min="10"
                                required 
                                className="w-full bg-surface-container border border-surface-container-high rounded-lg px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1">Minimum Order Value (₹)</label>
                            <input 
                                type="number" 
                                name="minimum_order_value" 
                                value={formData.minimum_order_value} 
                                onChange={handleChange} 
                                min="0"
                                required 
                                className="w-full bg-surface-container border border-surface-container-high rounded-lg px-4 py-2.5 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-surface-container-high flex justify-end gap-3">
                    <Link 
                        to="/owner/restaurants" 
                        className="px-6 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
                    >
                        Cancel
                    </Link>
                    <button 
                        type="submit" 
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> 
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};
