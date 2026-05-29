import React from 'react';
import { useCart } from '../../hooks/queries/useCartQueries';
import { useCartActions } from '../../hooks/actions/useCartActions';
import { cn } from '../common/Toast';

export const MenuItemCard = ({ item }) => {
    const { data: cart } = useCart();
    const { addItem, updateQuantity } = useCartActions();
    
    // Check if item is already in cart
    const cartItem = cart?.items?.find(i => i.menu_item_id === item.id);
    const quantity = cartItem?.quantity || 0;

    const handleAdd = () => addItem(item, 1);
    const handleIncrement = () => updateQuantity(cartItem.id, quantity + 1);
    const handleDecrement = () => updateQuantity(cartItem.id, quantity - 1);

    return (
        <div className="flex gap-4 p-4 bg-surface-container-lowest border-b border-surface-container-high last:border-0 hover:bg-surface-container-low transition-colors">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <div className={cn(
                        "w-4 h-4 border flex items-center justify-center rounded-sm",
                        item.is_veg ? "border-status-success" : "border-error"
                    )}>
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            item.is_veg ? "bg-status-success" : "bg-error"
                        )} />
                    </div>
                    {item.is_bestseller && (
                        <span className="text-[10px] font-bold text-primary bg-primary-container px-1.5 rounded-full">
                            BESTSELLER
                        </span>
                    )}
                </div>
                
                <h4 className="text-headline-md font-bold text-on-surface mb-1">{item.name}</h4>
                <div className="font-bold text-on-surface mb-2 text-sm">₹{item.price}</div>
                <p className="text-body-sm text-on-surface-variant line-clamp-2">
                    {item.description}
                </p>
            </div>
            
            <div className="w-28 flex flex-col items-center">
                <div className="w-28 h-28 bg-surface-container rounded-xl overflow-hidden shadow-sm relative">
                    <img 
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=60'} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    
                    {!item.is_available && (
                        <div className="absolute inset-0 bg-surface-dark/60 flex items-center justify-center">
                            <span className="text-on-primary text-xs font-bold text-center px-1">Out of Stock</span>
                        </div>
                    )}
                </div>
                
                <div className="relative -mt-4 w-24">
                    {item.is_available ? (
                        quantity > 0 ? (
                            <div className="flex items-center justify-between bg-surface border border-surface-container-highest rounded-lg shadow-sm font-bold overflow-hidden h-9">
                                <button 
                                    onClick={handleDecrement}
                                    className="w-8 h-full text-on-surface-variant hover:bg-surface-container-low flex items-center justify-center transition-colors"
                                >
                                    -
                                </button>
                                <span className="text-primary text-sm">{quantity}</span>
                                <button 
                                    onClick={handleIncrement}
                                    className="w-8 h-full text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
                                >
                                    +
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={handleAdd}
                                className="w-full h-9 bg-surface text-primary border border-surface-container-highest rounded-lg font-bold shadow-sm hover:bg-surface-container-lowest hover:shadow-md transition-all"
                            >
                                ADD
                            </button>
                        )
                    ) : null}
                </div>
            </div>
        </div>
    );
};
