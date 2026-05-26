import { menuApi } from './api.js';

let currentRestaurantId = null;
let categories = [];
let items = [];

// DOM Elements
const restaurantNameLabel = document.getElementById('restaurantNameLabel');
const menuContainer = document.getElementById('menuContainer');
const categoryModal = document.getElementById('categoryModal');
const itemModal = document.getElementById('itemModal');
const itemCategorySelect = document.getElementById('itemCategory');

// Category Form Elements
const categoryForm = document.getElementById('categoryForm');
const categoryIdInput = document.getElementById('categoryId');
const categoryNameInput = document.getElementById('categoryName');
const categoryDescInput = document.getElementById('categoryDescription');

// Item Form Elements
const itemForm = document.getElementById('itemForm');
const itemIdInput = document.getElementById('itemId');
const itemNameInput = document.getElementById('itemName');
const itemPriceInput = document.getElementById('itemPrice');
const itemDescInput = document.getElementById('itemDescription');
const itemVegInputs = document.getElementsByName('itemVeg');
const itemTagsInput = document.getElementById('itemTags');
const itemSpicyInput = document.getElementById('itemSpicy');
const itemPrepInput = document.getElementById('itemPrep');
const itemImageInput = document.getElementById('itemImage');

// --- Initialization ---

document.addEventListener('DOMContentLoaded', async () => {
    // Get restaurant ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentRestaurantId = urlParams.get('id');

    if (!currentRestaurantId) {
        alert("No restaurant ID provided.");
        window.location.href = "owner-dashboard.html";
        return;
    }
    
    // In a real app we'd fetch the restaurant details to show the name
    restaurantNameLabel.textContent = `Managing menu for restaurant`;

    await loadMenuData();

    // Event Listeners for Modals
    document.getElementById('logoutBtn').addEventListener('click', () => {
        // Implement logout or redirect
        window.location.href = "login.html";
    });

    categoryForm.addEventListener('submit', handleCategorySubmit);
    itemForm.addEventListener('submit', handleItemSubmit);
    
    // Expose functions to global scope for inline onclick handlers
    window.openCategoryModal = openCategoryModal;
    window.closeCategoryModal = closeCategoryModal;
    window.openItemModal = openItemModal;
    window.closeItemModal = closeItemModal;
    window.editCategory = editCategory;
    window.deleteCategory = deleteCategory;
    window.editItem = editItem;
    window.deleteItem = deleteItem;
    window.toggleItemAvailability = toggleItemAvailability;
});

// --- Data Fetching ---

async function loadMenuData() {
    try {
        const [catRes, itemRes] = await Promise.all([
            menuApi.getCategories(currentRestaurantId),
            menuApi.getItems(currentRestaurantId)
        ]);
        
        categories = catRes.data;
        items = itemRes.data;
        
        renderMenu();
        updateCategorySelect();
    } catch (error) {
        console.error("Error loading menu:", error);
        menuContainer.innerHTML = `<div class="text-center text-red-600 py-12">Failed to load menu data. Ensure the restaurant is APPROVED.</div>`;
    }
}

// --- Rendering ---

function renderMenu() {
    if (categories.length === 0) {
        menuContainer.innerHTML = `
            <div class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <i data-lucide="folder-open" class="mx-auto h-12 w-12 text-gray-400 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900">No categories yet</h3>
                <p class="text-gray-500 mt-1">Start by adding a category for your menu.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    let html = '';
    
    categories.forEach(category => {
        const categoryItems = items.filter(item => item.category_id === category.id);
        
        html += `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                        <h2 class="text-lg font-bold text-gray-900">${category.name}</h2>
                        ${category.description ? `<p class="text-sm text-gray-500 mt-1">${category.description}</p>` : ''}
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editCategory('${category.id}')" class="p-2 text-gray-400 hover:text-orange-600 transition-colors" title="Edit Category">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteCategory('${category.id}')" class="p-2 text-gray-400 hover:text-red-600 transition-colors" title="Delete Category">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="divide-y divide-gray-100">
        `;
        
        if (categoryItems.length === 0) {
            html += `
                <div class="px-6 py-8 text-center text-gray-500 text-sm">
                    No items in this category.
                </div>
            `;
        } else {
            categoryItems.forEach(item => {
                const vegIcon = item.is_veg 
                    ? `<span class="inline-block w-4 h-4 border-2 border-green-600 p-0.5 rounded-sm flex items-center justify-center" title="Veg"><span class="w-1.5 h-1.5 bg-green-600 rounded-full"></span></span>`
                    : `<span class="inline-block w-4 h-4 border-2 border-red-600 p-0.5 rounded-sm flex items-center justify-center" title="Non-Veg"><span class="w-1.5 h-1.5 bg-red-600 rounded-full"></span></span>`;
                
                html += `
                    <div class="px-6 py-4 flex justify-between items-start gap-4 hover:bg-gray-50 transition-colors">
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                ${vegIcon}
                                <h4 class="font-semibold text-gray-900">${item.name}</h4>
                            </div>
                            <p class="text-sm font-medium text-gray-900 mt-1">₹${item.price}</p>
                            ${item.description ? `<p class="text-sm text-gray-500 mt-1 line-clamp-2">${item.description}</p>` : ''}
                            
                            <div class="flex items-center gap-3 mt-2">
                                ${item.dietary_tags && item.dietary_tags.length > 0 ? 
                                    `<div class="flex gap-1">${item.dietary_tags.map(tag => `<span class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">${tag}</span>`).join('')}</div>` 
                                    : ''}
                                ${item.spicy_level > 0 ? 
                                    `<span class="text-xs font-medium text-red-600 flex items-center gap-1"><i data-lucide="flame" class="w-3 h-3"></i> ${'🌶️'.repeat(item.spicy_level)}</span>` 
                                    : ''}
                            </div>
                        </div>
                        
                        ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="w-24 h-24 object-cover rounded-lg">` : ''}
                        
                        <div class="flex flex-col items-end gap-2 ml-4 border-l pl-4 border-gray-100">
                            <label class="flex items-center cursor-pointer gap-2 mb-2" title="Toggle Availability">
                                <span class="text-xs text-gray-500 font-medium">${item.is_available ? 'Available' : 'Out of Stock'}</span>
                                <div class="relative">
                                    <input type="checkbox" class="sr-only" ${item.is_available ? 'checked' : ''} onchange="toggleItemAvailability('${item.id}', this.checked)">
                                    <div class="block w-8 h-4 bg-gray-200 rounded-full ${item.is_available ? 'bg-orange-500' : ''} transition-colors"></div>
                                    <div class="dot absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform ${item.is_available ? 'transform translate-x-4' : ''}"></div>
                                </div>
                            </label>
                            
                            <div class="flex gap-2">
                                <button onclick="editItem('${item.id}')" class="p-1.5 text-gray-400 hover:text-orange-600 transition-colors">
                                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                                </button>
                                <button onclick="deleteItem('${item.id}')" class="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    menuContainer.innerHTML = html;
    lucide.createIcons();
}

function updateCategorySelect() {
    itemCategorySelect.innerHTML = '<option value="">Select a category</option>' + 
        categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

// --- Category Modal Handlers ---

function openCategoryModal(categoryId = null) {
    if (categoryId) {
        const cat = categories.find(c => c.id === categoryId);
        if (cat) {
            document.getElementById('categoryModalTitle').textContent = 'Edit Category';
            categoryIdInput.value = cat.id;
            categoryNameInput.value = cat.name;
            categoryDescInput.value = cat.description || '';
        }
    } else {
        document.getElementById('categoryModalTitle').textContent = 'Add Category';
        categoryForm.reset();
        categoryIdInput.value = '';
    }
    categoryModal.classList.remove('hidden');
}

function closeCategoryModal() {
    categoryModal.classList.add('hidden');
    categoryForm.reset();
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const id = categoryIdInput.value;
    const payload = {
        name: categoryNameInput.value,
        description: categoryDescInput.value || null
    };
    
    try {
        if (id) {
            await menuApi.updateCategory(currentRestaurantId, id, payload);
        } else {
            await menuApi.createCategory(currentRestaurantId, payload);
        }
        closeCategoryModal();
        await loadMenuData();
    } catch (error) {
        console.error(error);
        alert(error.response?.data?.detail || "Failed to save category");
    }
}

async function editCategory(id) {
    openCategoryModal(id);
}

async function deleteCategory(id) {
    if (confirm("Are you sure you want to delete this category?")) {
        try {
            await menuApi.deleteCategory(currentRestaurantId, id);
            await loadMenuData();
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to delete category");
        }
    }
}

// --- Item Modal Handlers ---

function openItemModal(itemId = null) {
    if (categories.length === 0) {
        alert("Please create a category first.");
        return;
    }
    
    if (itemId) {
        const item = items.find(i => i.id === itemId);
        if (item) {
            document.getElementById('itemModalTitle').textContent = 'Edit Menu Item';
            itemIdInput.value = item.id;
            itemNameInput.value = item.name;
            itemCategorySelect.value = item.category_id;
            itemPriceInput.value = item.price;
            itemDescInput.value = item.description || '';
            
            itemVegInputs.forEach(radio => {
                radio.checked = (radio.value === 'true' && item.is_veg) || (radio.value === 'false' && !item.is_veg);
            });
            
            itemTagsInput.value = item.dietary_tags ? item.dietary_tags.join(', ') : '';
            itemSpicyInput.value = item.spicy_level;
            itemPrepInput.value = item.preparation_time_minutes;
            itemImageInput.value = item.image_url || '';
        }
    } else {
        document.getElementById('itemModalTitle').textContent = 'Add Menu Item';
        itemForm.reset();
        itemIdInput.value = '';
    }
    itemModal.classList.remove('hidden');
}

function closeItemModal() {
    itemModal.classList.add('hidden');
    itemForm.reset();
}

async function handleItemSubmit(e) {
    e.preventDefault();
    
    const id = itemIdInput.value;
    
    // Parse tags
    let tags = [];
    if (itemTagsInput.value) {
        tags = itemTagsInput.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
    
    // Get is_veg value
    let isVeg = true;
    for (const radio of itemVegInputs) {
        if (radio.checked) {
            isVeg = radio.value === 'true';
            break;
        }
    }
    
    const payload = {
        name: itemNameInput.value,
        category_id: itemCategorySelect.value,
        price: parseFloat(itemPriceInput.value),
        description: itemDescInput.value || null,
        is_veg: isVeg,
        dietary_tags: tags,
        spicy_level: parseInt(itemSpicyInput.value) || 0,
        preparation_time_minutes: parseInt(itemPrepInput.value) || 15,
        image_url: itemImageInput.value || null
    };
    
    try {
        if (id) {
            await menuApi.updateItem(currentRestaurantId, id, payload);
        } else {
            await menuApi.createItem(currentRestaurantId, payload);
        }
        closeItemModal();
        await loadMenuData();
    } catch (error) {
        console.error(error);
        alert(error.response?.data?.detail || "Failed to save menu item");
    }
}

async function editItem(id) {
    openItemModal(id);
}

async function deleteItem(id) {
    if (confirm("Are you sure you want to delete this menu item?")) {
        try {
            await menuApi.deleteItem(currentRestaurantId, id);
            await loadMenuData();
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to delete item");
        }
    }
}

async function toggleItemAvailability(id, isAvailable) {
    try {
        await menuApi.toggleItemAvailability(currentRestaurantId, id, isAvailable);
        // Silently update local state instead of full reload to prevent UI jump
        const item = items.find(i => i.id === id);
        if (item) item.is_available = isAvailable;
    } catch (error) {
        alert(error.response?.data?.detail || "Failed to update availability");
        await loadMenuData(); // Reload to reset UI state
    }
}
