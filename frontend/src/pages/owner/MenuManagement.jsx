import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOwnerMenuItems, useOwnerCategories } from '../../hooks/queries/useOwnerQueries';
import { useCreateMenuItemMutation, useUpdateMenuItemMutation, useDeleteMenuItemMutation, useToggleMenuItemAvailabilityMutation } from '../../hooks/mutations/useOwnerMutations';
import { MenuItemForm } from '../../components/owner/MenuItemForm';
import { PageLoader } from '../../components/common/PageLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Edit2, Trash2, ArrowLeft, GripVertical } from 'lucide-react';

export const MenuManagement = () => {
    const { restaurantId } = useParams();
    const { addToast } = useToast();
    
    const { data: items, isLoading: itemsLoading, error: itemsError } = useOwnerMenuItems(restaurantId);
    const { data: categories, isLoading: catLoading } = useOwnerCategories(restaurantId);
    
    const createMutation = useCreateMenuItemMutation();
    const updateMutation = useUpdateMenuItemMutation();
    const deleteMutation = useDeleteMenuItemMutation();
    const toggleMutation = useToggleMenuItemAvailabilityMutation();
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const handleOpenCreate = () => {
        setEditingItem(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const handleSubmitForm = async (formData) => {
        try {
            if (editingItem) {
                await updateMutation.mutateAsync({ restaurantId, itemId: editingItem.id, data: formData });
                addToast('Item updated successfully', 'success');
            } else {
                await createMutation.mutateAsync({ restaurantId, data: formData });
                addToast('Item created successfully', 'success');
            }
            setIsFormOpen(false);
        } catch (err) {
            addToast(err.message || 'Failed to save item', 'error');
        }
    };

    const handleDelete = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await deleteMutation.mutateAsync({ restaurantId, itemId });
            addToast('Item deleted', 'success');
        } catch (err) {
            addToast('Failed to delete item', 'error');
        }
    };

    const handleToggleAvailability = async (itemId, currentStatus) => {
        try {
            await toggleMutation.mutateAsync({ restaurantId, itemId, isAvailable: !currentStatus });
        } catch (err) {
            addToast('Failed to toggle availability', 'error');
        }
    };

    if (itemsLoading || catLoading) return <PageLoader message="Loading menu..." />;
    if (itemsError) return <ErrorState message={itemsError.message} />;

    // Group items by category
    const groupedItems = items?.reduce((acc, item) => {
        const catId = item.category_id;
        if (!acc[catId]) acc[catId] = [];
        acc[catId].push(item);
        return acc;
    }, {}) || {};

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/owner/restaurants" className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-on-surface">Menu Management</h1>
                    <p className="text-on-surface-variant text-sm">Add or edit items and categories.</p>
                </div>
            </div>

            <div className="flex justify-end gap-3">
                <button 
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-bold rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Item
                </button>
            </div>

            {categories?.length === 0 ? (
                <div className="bg-surface-container-lowest p-8 rounded-xl border border-surface-container-high text-center">
                    <p className="text-on-surface font-medium">No categories found.</p>
                    <p className="text-on-surface-variant text-sm mt-1">Contact admin to setup menu categories.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {categories?.map(category => {
                        const catItems = groupedItems[category.id] || [];
                        if (catItems.length === 0) return null; // Hide empty categories
                        
                        return (
                            <div key={category.id} className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm overflow-hidden">
                                <div className="px-5 py-3 border-b border-surface-container-high bg-surface-container-low flex justify-between items-center">
                                    <h2 className="font-black text-lg text-on-surface">{category.name}</h2>
                                    <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                                        {catItems.length} items
                                    </span>
                                </div>
                                <div className="divide-y divide-surface-container-high">
                                    {catItems.map(item => (
                                        <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-lowest/50 transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 cursor-move opacity-30 hover:opacity-100 hidden sm:block">
                                                    <GripVertical className="w-5 h-5 text-on-surface-variant" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`w-3 h-3 rounded-full border-2 ${item.is_veg ? 'border-status-success bg-status-success/20' : 'border-error bg-error/20'}`} title={item.is_veg ? 'Veg' : 'Non-veg'} />
                                                        <h3 className="font-bold text-on-surface">{item.name}</h3>
                                                        <span className="font-black text-on-surface ml-2">₹{item.price}</span>
                                                    </div>
                                                    {item.description && <p className="text-sm text-on-surface-variant line-clamp-2">{item.description}</p>}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 self-end sm:self-auto border-t sm:border-0 border-surface-container pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                                                <label className="flex items-center gap-2 cursor-pointer mr-2">
                                                    <div className={`relative inline-block w-10 h-5 transition duration-200 ease-linear rounded-full ${item.is_available ? 'bg-status-success' : 'bg-surface-container-high'}`}>
                                                        <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white border-2 border-transparent rounded-full shadow-sm transition-transform duration-200 ease-in-out ${item.is_available ? 'transform translate-x-5' : ''}`}></span>
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        className="hidden" 
                                                        checked={item.is_available} 
                                                        onChange={() => handleToggleAvailability(item.id, item.is_available)}
                                                        disabled={toggleMutation.isPending}
                                                    />
                                                    <span className="text-xs font-bold text-on-surface-variant uppercase w-16 text-right">
                                                        {item.is_available ? 'In Stock' : 'Out'}
                                                    </span>
                                                </label>
                                                
                                                <button 
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container rounded-lg transition-colors"
                                                    title="Edit Item"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
                                                    title="Delete Item"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isFormOpen && (
                <MenuItemForm 
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleSubmitForm}
                    item={editingItem}
                    categories={categories}
                />
            )}
        </div>
    );
};
