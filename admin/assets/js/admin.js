// Admin Dashboard JavaScript
// Handles fetching, rendering, modals, and CRUD operations

// DOM Elements
let currentModal = null;
let currentForm = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Dashboard specific
    if (document.getElementById('total-products')) {
        loadDashboardStats();
    }

    // Products page
    if (document.getElementById('products-table-body')) {
        initializeProductsPage();
    }

    // Categories page
    if (document.getElementById('categories-table-body')) {
        initializeCategoriesPage();
    }

    // Login page
    if (document.getElementById('login-form')) {
        initializeLoginPage();
    }
});

// ==================== DASHBOARD FUNCTIONS ====================

async function loadDashboardStats() {
    try {
        // Use dummy data instead of API calls
        const dummyProducts = [
            { id: 1, name: "Luxury Lipstick", category: "Cosmetics", price: 25 },
            { id: 2, name: "Hair Straightener", category: "Hair Tools", price: 50 },
            { id: 3, name: "Facial Cleanser", category: "Cosmetics", price: 15 },
            { id: 4, name: "Beauty Blender", category: "Cosmetics", price: 10 },
            { id: 5, name: "Hair Dryer", category: "Hair Tools", price: 40 },
            { id: 6, name: "Nail Polish Set", category: "Cosmetics", price: 20 }
        ];

        const dummyCategories = [
            { id: 1, name: "Cosmetics" },
            { id: 2, name: "Hair Tools" },
            { id: 3, name: "Accessories" }
        ];

        // Update stats
        document.getElementById('total-products').textContent = dummyProducts.length;
        document.getElementById('total-categories').textContent = dummyCategories.length;
        document.getElementById('total-orders').textContent = '0'; // Placeholder
        document.getElementById('total-revenue').textContent = '$0'; // Placeholder

        // Load recent orders
        await loadRecentOrders();

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Fallback values
        document.getElementById('total-products').textContent = '6';
        document.getElementById('total-categories').textContent = '3';
        document.getElementById('total-orders').textContent = '0';
        document.getElementById('total-revenue').textContent = '$0';
    }
}

async function loadRecentOrders() {
    try {
        // Use dummy data instead of API call
        const orders = [
            { customer: "Jane Doe", product: "Luxury Lipstick", date: "2023-12-01" },
            { customer: "John Smith", product: "Hair Straightener", date: "2023-11-28" }
        ];

        const container = document.getElementById('recent-orders');
        if (orders && orders.length > 0) {
            container.innerHTML = orders.map(order => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium">${order.customer || 'Unknown'}</p>
                        <p class="text-sm text-gray-600">${order.product || 'N/A'}</p>
                    </div>
                    <span class="text-sm text-gray-500">${formatDate(order.date) || 'N/A'}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-gray-600">No recent orders</p>';
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
        document.getElementById('recent-orders').innerHTML = '<p class="text-red-600">Error loading orders</p>';
    }
}

// ==================== PRODUCTS FUNCTIONS ====================

function initializeProductsPage() {
    loadProducts();
    loadCategoriesForSelect();

    // Event listeners
    document.getElementById('search-input').addEventListener('input', filterProducts);
    document.getElementById('add-product-btn').addEventListener('click', () => openProductModal());
    setupModalEvents('product-modal', 'product-form');
}

async function loadProducts() {
    try {
        showLoading(document.getElementById('products-table-body'));

        // Use dummy data instead of API call
        const products = [
            { id: 1, name: "Luxury Lipstick", category: "Cosmetics", price: 25, image: "https://picsum.photos/50/50?text=Lipstick", description: "Long-lasting, vibrant color lipstick." },
            { id: 2, name: "Hair Straightener", category: "Hair Tools", price: 50, image: "https://picsum.photos/50/50?text=Straightener", description: "Professional hair straightener with ceramic plates." },
            { id: 3, name: "Facial Cleanser", category: "Cosmetics", price: 15, image: "https://picsum.photos/50/50?text=Cleanser", description: "Gentle cleanser for all skin types." },
            { id: 4, name: "Beauty Blender", category: "Cosmetics", price: 10, image: "https://picsum.photos/50/50?text=Blender", description: "High-quality makeup sponge." },
            { id: 5, name: "Hair Dryer", category: "Hair Tools", price: 40, image: "https://picsum.photos/50/50?text=Dryer", description: "Powerful ionic hair dryer." },
            { id: 6, name: "Nail Polish Set", category: "Cosmetics", price: 20, image: "https://picsum.photos/50/50?text=Nail", description: "Set of 6 vibrant nail polishes." }
        ];

        if (products && products.length > 0) {
            displayProducts(products);
            document.getElementById('empty-state').classList.add('hidden');
        } else {
            document.getElementById('empty-state').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showAlert('Error loading products', 'error');
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="${product.image || 'https://placehold.co/50x50/ffffff/000000.png?text=No+Image'}" alt="${product.name}" class="w-12 h-12 object-cover rounded-lg">
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${product.name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    ${product.category || 'Uncategorized'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                KSH ${product.price || '0.00'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editProduct(${product.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button onclick="deleteProduct(${product.id})" class="text-red-600 hover:text-red-900">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const rows = document.querySelectorAll('#products-table-body tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

async function loadCategoriesForSelect() {
    try {
        // Use dummy data instead of API call
        const categories = [
            { id: 1, name: "Cosmetics" },
            { id: 2, name: "Hair Tools" },
            { id: 3, name: "Accessories" }
        ];

        const select = document.getElementById('product-category');
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function openProductModal(product = null) {
    currentModal = document.getElementById('product-modal');
    currentForm = document.getElementById('product-form');

    if (product) {
        document.getElementById('modal-title').textContent = 'Edit Product';
        populateProductForm(product);
    } else {
        document.getElementById('modal-title').textContent = 'Add Product';
        currentForm.reset();
    }

    currentModal.classList.remove('hidden');
}

function populateProductForm(product) {
    document.getElementById('product-id').value = product.id || '';
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-category').value = product.category_id || '';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-description').value = product.description || '';
}

async function saveProduct(e) {
    e.preventDefault();

    const formData = new FormData(currentForm);
    const productData = Object.fromEntries(formData);

    // Simulate API call with dummy response
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Always succeed for demo
        showAlert('Product saved successfully!', 'success');
        closeModal();
        await loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showAlert('Error saving product', 'error');
    }
}

async function editProduct(id) {
    try {
        // Use dummy data instead of API call
        const dummyProducts = [
            { id: 1, name: "Luxury Lipstick", category: "Cosmetics", price: 25, description: "Long-lasting, vibrant color lipstick." },
            { id: 2, name: "Hair Straightener", category: "Hair Tools", price: 50, description: "Professional hair straightener with ceramic plates." },
            { id: 3, name: "Facial Cleanser", category: "Cosmetics", price: 15, description: "Gentle cleanser for all skin types." },
            { id: 4, name: "Beauty Blender", category: "Cosmetics", price: 10, description: "High-quality makeup sponge." },
            { id: 5, name: "Hair Dryer", category: "Hair Tools", price: 40, description: "Powerful ionic hair dryer." },
            { id: 6, name: "Nail Polish Set", category: "Cosmetics", price: 20, description: "Set of 6 vibrant nail polishes." }
        ];

        const product = dummyProducts.find(p => p.id == id);
        if (product) {
            openProductModal(product);
        } else {
            showAlert('Product not found', 'error');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showAlert('Error loading product', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirmAction('Are you sure you want to delete this product?')) return;

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        showAlert('Product deleted successfully!', 'success');
        await loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showAlert('Error deleting product', 'error');
    }
}

// ==================== CATEGORIES FUNCTIONS ====================

function initializeCategoriesPage() {
    loadCategories();

    // Event listeners
    document.getElementById('add-category-btn').addEventListener('click', () => openCategoryModal());
    setupModalEvents('category-modal', 'category-form');
}

async function loadCategories() {
    try {
        showLoading(document.getElementById('categories-table-body'));

        // Use dummy data instead of API call
        const categories = [
            { id: 1, name: "Cosmetics", description: "Makeup and skincare products", product_count: 4 },
            { id: 2, name: "Hair Tools", description: "Professional hair styling tools", product_count: 2 },
            { id: 3, name: "Accessories", description: "Beauty accessories and tools", product_count: 0 }
        ];

        if (categories && categories.length > 0) {
            displayCategories(categories);
            document.getElementById('empty-state').classList.add('hidden');
        } else {
            document.getElementById('empty-state').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showAlert('Error loading categories', 'error');
    }
}

function displayCategories(categories) {
    const tbody = document.getElementById('categories-table-body');
    tbody.innerHTML = '';

    categories.forEach(category => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${category.name}</div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate">${category.description || 'No description'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${category.product_count || 0} products
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editCategory(${category.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button onclick="deleteCategory(${category.id})" class="text-red-600 hover:text-red-900">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

function openCategoryModal(category = null) {
    currentModal = document.getElementById('category-modal');
    currentForm = document.getElementById('category-form');

    if (category) {
        document.getElementById('modal-title').textContent = 'Edit Category';
        populateCategoryForm(category);
    } else {
        document.getElementById('modal-title').textContent = 'Add Category';
        currentForm.reset();
    }

    currentModal.classList.remove('hidden');
}

function populateCategoryForm(category) {
    document.getElementById('category-id').value = category.id || '';
    document.getElementById('category-name').value = category.name || '';
    document.getElementById('category-description').value = category.description || '';
}

async function saveCategory(e) {
    e.preventDefault();

    const formData = new FormData(currentForm);
    const categoryData = Object.fromEntries(formData);

    // Simulate API call with dummy response
    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Always succeed for demo
        showAlert('Category saved successfully!', 'success');
        closeModal();
        await loadCategories();
    } catch (error) {
        console.error('Error saving category:', error);
        showAlert('Error saving category', 'error');
    }
}

async function editCategory(id) {
    try {
        // Use dummy data instead of API call
        const dummyCategories = [
            { id: 1, name: "Cosmetics", description: "Makeup and skincare products" },
            { id: 2, name: "Hair Tools", description: "Professional hair styling tools" },
            { id: 3, name: "Accessories", description: "Beauty accessories and tools" }
        ];

        const category = dummyCategories.find(c => c.id == id);
        if (category) {
            openCategoryModal(category);
        } else {
            showAlert('Category not found', 'error');
        }
    } catch (error) {
        console.error('Error loading category:', error);
        showAlert('Error loading category', 'error');
    }
}

async function deleteCategory(id) {
    if (!confirmAction('Are you sure you want to delete this category?')) return;

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        showAlert('Category deleted successfully!', 'success');
        await loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showAlert('Error deleting category', 'error');
    }
}

// ==================== LOGIN FUNCTIONS ====================

function initializeLoginPage() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Demo login (replace with real authentication)
    if (username === 'admin' && password === 'admin') {
        showAlert('Login successful!', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } else {
        showAlert('Invalid credentials', 'error');
    }
}

// ==================== SHARED FUNCTIONS ====================

function setupModalEvents(modalId, formId) {
    const modal = document.getElementById(modalId);
    const closeBtn = modal.querySelector('#close-modal, #cancel-btn');

    closeBtn.addEventListener('click', closeModal);

    // Close on outside click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function closeModal() {
    if (currentModal) {
        currentModal.classList.add('hidden');
        currentModal = null;
        currentForm = null;
    }
}

function showLoading(element) {
    element.innerHTML = `
        <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span class="ml-2">Loading...</span>
        </div>
    `;
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Make functions globally available
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;