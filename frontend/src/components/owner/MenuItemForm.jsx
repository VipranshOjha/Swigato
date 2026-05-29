import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';

export const MenuItemForm = ({ isOpen, onClose, onSubmit, item, categories }) => {
    const isEdit = !!item;
    
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        is_veg: true,
        category_id: '',
        is_available: true,
    });

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                description: item.description || '',
                price: item.price || '',
                is_veg: item.is_veg ?? true,
                category_id: item.category_id || '',
                is_available: item.is_available ?? true,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                price: '',
                is_veg: true,
                category_id: categories?.[0]?.id || '',
                is_available: true,
            });
        }
    }, [item, categories, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            price: parseFloat(formData.price),
        });
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={isEdit ? "Edit Menu Item" : "Add Menu Item"}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Name</label>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                        className="w-full bg-surface-container border border-surface-container-high rounded-lg px-3 py-2 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Description</label>
                    <textarea 
                        name="description" 
                        value={formData.description} 
                        onChange={handleChange} 
                        rows="3" 
                        className="w-full bg-surface-container border border-surface-container-high rounded-lg px-3 py-2 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1">Price (₹)</label>
                        <input 
                            type="number" 
                            name="price" 
                            value={formData.price} 
                            onChange={handleChange} 
                            required 
                            min="0"
                            step="0.01"
                            className="w-full bg-surface-container border border-surface-container-high rounded-lg px-3 py-2 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-on-surface mb-1">Category</label>
                        <select 
                            name="category_id" 
                            value={formData.category_id} 
                            onChange={handleChange} 
                            required 
                            className="w-full bg-surface-container border border-surface-container-high rounded-lg px-3 py-2 text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        >
                            <option value="">Select Category</option>
                            {categories?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="is_veg" 
                            checked={formData.is_veg} 
                            onChange={handleChange} 
                            className="rounded border-surface-container-high text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-on-surface">Vegetarian</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="is_available" 
                            checked={formData.is_available} 
                            onChange={handleChange} 
                            className="rounded border-surface-container-high text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-on-surface">Available in stock</span>
                    </label>
                </div>
                
                <div className="pt-4 border-t border-surface-container-high flex justify-end gap-2">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-4 py-2 text-sm font-bold bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
                    >
                        {isEdit ? "Save Changes" : "Add Item"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
