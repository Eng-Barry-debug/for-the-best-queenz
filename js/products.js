// API configuration
const API_BASE_URL = 'http://localhost:8000/api';
let products = [];
let categories = [];
let isLoading = false;
let error = null;

// Function to fetch categories from the API
async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        categories = Array.isArray(data) ? data : [];
        return categories;
    } catch (err) {
        console.error('Error fetching categories:', err);
        return [];
    }
}

// Function to create filter buttons dynamically
function createFilterButtons() {
    const filterContainer = document.getElementById('filter-buttons');
    if (!filterContainer) return;

    // Clear existing buttons
    filterContainer.innerHTML = '';

    // Add "All Products" button
    const allButton = document.createElement('button');
    allButton.className = 'filter-btn bg-purple-600 text-white px-6 py-2 rounded-full font-medium hover:bg-purple-700 transition-colors';
    allButton.setAttribute('data-category', 'all');
    allButton.textContent = 'All Products';
    filterContainer.appendChild(allButton);

    // Add category buttons
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'filter-btn bg-gray-200 text-gray-700 px-6 py-2 rounded-full font-medium hover:bg-purple-600 hover:text-white transition-colors';
        button.setAttribute('data-category', category.name.toLowerCase().replace(/\s+/g, '-'));
        button.textContent = category.name;
        filterContainer.appendChild(button);
    });

    // Add event listeners to filter buttons
    setupFilterButtonListeners();
}

// Function to set up filter button event listeners
function setupFilterButtonListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => {
                btn.classList.remove('bg-purple-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });

            // Add active class to clicked button
            this.classList.remove('bg-gray-200', 'text-gray-700');
            this.classList.add('bg-purple-600', 'text-white');

            // Filter products
            const category = this.getAttribute('data-category');
            filterProductsByCategory(category);
        });
    });
}

// Function to filter products by category
function filterProductsByCategory(category) {
    const containerId = document.getElementById('products-grid') ? 'products-grid' : 'featured-products';

    let filteredProducts = [...products];

    if (category !== 'all') {
        // Convert category back to original format (e.g., 'hair-tools' -> 'Hair Tools')
        const formattedCategory = category.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        filteredProducts = filteredProducts.filter(product =>
            product.category && product.category.toLowerCase() === formattedCategory.toLowerCase()
        );
    }

    renderProducts(containerId, filteredProducts);
}

// Function to fetch products from the API
async function fetchProducts() {
    try {
        isLoading = true;
        updateLoadingState(true);

        const response = await fetch(`${API_BASE_URL}/products`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        products = Array.isArray(data) ? data : [];
        error = null;
        return products;
    } catch (err) {
        console.error('Error fetching products:', err);
        error = err;
        showError('Failed to load products. Please try again later.');
        return [];
    } finally {
        isLoading = false;
        updateLoadingState(false);
    }
}

// Function to update loading state
function updateLoadingState(loading) {
    const loadingElement = document.getElementById('loading-state');
    const contentElement = document.getElementById('products-container') || document.getElementById('featured-products');
    
    if (loadingElement) {
        loadingElement.style.display = loading ? 'block' : 'none';
    }
    
    if (contentElement) {
        contentElement.style.opacity = loading ? '0.5' : '1';
        contentElement.style.pointerEvents = loading ? 'none' : 'auto';
    }
}

// Function to show error messages
function showError(message) {
    const errorElement = document.getElementById('error-state') || createErrorElement();
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

// Create error element if it doesn't exist
function createErrorElement() {
    const errorElement = document.createElement('div');
    errorElement.id = 'error-state';
    errorElement.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
    document.body.appendChild(errorElement);
    return errorElement;
}

// Function to render products
function renderProducts(containerId, productList = products) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show loading state if data is being fetched
    if (isLoading) {
        container.innerHTML = `
            <div class="col-span-full flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        `;
        return;
    }

    // Show error message if there was an error
    if (error) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-red-600">Failed to load products. Please try again later.</p>
                <button onclick="window.location.reload()" class="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
                    Retry
                </button>
            </div>
        `;
        return;
    }

    // Show message if no products are available
    if (productList.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-gray-600">No products found.</p>
            </div>
        `;
        return;
    }

    // Render products
    container.innerHTML = productList.map(product => `
        <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 group">
            <div class="relative overflow-hidden">
                <img 
                    src="${product.image || 'https://placehold.co/300x200/ffffff/000000.png?text=No+Image'}" 
                    alt="${product.name}" 
                    class="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                    onerror="this.src='https://placehold.co/300x200/ffffff/000000.png?text=No+Image'"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-semibold mb-3 text-gray-800 group-hover:text-purple-600 transition-colors">${product.name || 'Unnamed Product'}</h3>
                <p class="text-gray-600 mb-4 leading-relaxed">${product.description || 'No description available.'}</p>
                <div class="flex justify-between items-center mb-4">
                    <p class="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
                        KSH ${(parseFloat(product.price) || 0).toFixed(2)}
                    </p>
                    ${product.category ? `<span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">${product.category}</span>` : ''}
                </div>
                <a 
                    href="https://wa.me/1234567890?text=Hello, I want to order ${encodeURIComponent(product.name || 'product')}" 
                    target="_blank" 
                    class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300 block text-center shadow-lg"
                >
                    Order Now
                </a>
            </div>
        </div>
    `).join('');
}

// Function to render featured products (first 3)
async function renderFeaturedProducts() {
    const products = await fetchProducts();
    renderProducts('featured-products', products.slice(0, 3));
}

// Initialize products on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Add loading state to the products container
    const productsContainer = document.getElementById('products-grid');
    const featuredContainer = document.getElementById('featured-products');

    // Create loading element if it doesn't exist
    if (productsContainer && !document.getElementById('loading-state')) {
        const loadingElement = document.createElement('div');
        loadingElement.id = 'loading-state';
        loadingElement.className = 'col-span-full flex justify-center items-center py-12';
        loadingElement.innerHTML = '<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>';
        productsContainer.parentNode.insertBefore(loadingElement, productsContainer);
    }

    // Load categories and create filter buttons
    await fetchCategories();
    createFilterButtons();

    // Load products
    if (featuredContainer) {
        await renderFeaturedProducts();
    }

    if (productsContainer) {
        const products = await fetchProducts();
        renderProducts('products-grid', products);
    }

    // Add filter and sort event listeners
    setupFilters();
});

// Set up filter and sort functionality
function setupFilters() {
    const categoryFilter = document.getElementById('category');
    const sortSelect = document.getElementById('sort');
    
    if (categoryFilter) {
        // Populate categories from products
        fetchProducts().then(products => {
            const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
            const categorySelect = document.getElementById('category');
            
            if (categorySelect) {
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categorySelect.appendChild(option);
                });
            }
        });
        
        categoryFilter.addEventListener('change', filterProducts);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', sortProducts);
    }
}

// Filter products by category
function filterProducts() {
    const category = document.getElementById('category')?.value;
    const containerId = document.getElementById('products-grid') ? 'products-grid' : 'featured-products';
    
    let filteredProducts = [...products];
    
    if (category) {
        filteredProducts = filteredProducts.filter(product => product.category === category);
    }
    
    renderProducts(containerId, filteredProducts);
}

// Sort products
function sortProducts() {
    const sortValue = document.getElementById('sort')?.value;
    const containerId = document.getElementById('products-grid') ? 'products-grid' : 'featured-products';
    
    let sortedProducts = [...products];
    
    switch (sortValue) {
        case 'price-low':
            sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-high':
            sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'name-asc':
            sortedProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'name-desc':
            sortedProducts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
        default:
            // Default sorting (featured or by ID)
            break;
    }
    
    renderProducts(containerId, sortedProducts);
}