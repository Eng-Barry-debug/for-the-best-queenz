// API configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Function to fetch featured products
async function fetchFeaturedProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products?featured=true`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching featured products:', error);
        return [];
    }
}

// Function to render featured products
function renderFeaturedProducts(products) {
    const container = document.getElementById('featured-products-grid');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-span-4 text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="mt-2 text-lg font-medium text-gray-900">No featured products found</h3>
                <p class="mt-1 text-gray-500">Check back later for our featured collection.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <div class="relative overflow-hidden">
                <div class="aspect-w-1 aspect-h-1 w-full">
                    <img src="${product.image || 'https://via.placeholder.com/500x500?text=Product+Image'}" 
                         alt="${product.name}" 
                         class="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110">
                </div>
                ${product.isNew ? `
                    <div class="absolute top-4 right-4">
                        <span class="bg-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full">New</span>
                    </div>
                ` : ''}
                ${product.discount ? `
                    <div class="absolute top-4 right-4">
                        <span class="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">-${product.discount}%</span>
                    </div>
                ` : ''}
                ${product.isBestSeller ? `
                    <div class="absolute top-4 right-4">
                        <span class="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Bestseller</span>
                    </div>
                ` : ''}
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <button class="add-to-cart w-full bg-white text-pink-600 font-semibold py-3 rounded-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300" 
                            data-product='${JSON.stringify(product).replace(/'/g, '&#39;')}'>
                        Add to Cart
                    </button>
                </div>
            </div>
            <div class="p-6">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-1">${product.name}</h3>
                        <p class="text-pink-600 font-medium">
                            KSH ${(parseFloat(product.price) || 0).toFixed(2)}
                            ${product.originalPrice ? `
                                <span class="text-gray-400 line-through text-sm ml-1">KSH ${(parseFloat(product.originalPrice) || 0).toFixed(2)}</span>
                            ` : ''}
                        </p>
                    </div>
                    ${product.rating ? `
                        <div class="flex items-center text-yellow-400">
                            ${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5 - Math.round(product.rating))}
                            <span class="text-gray-400 text-sm ml-1">(${product.reviewCount || 0})</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// Initialize featured products on page load
document.addEventListener('DOMContentLoaded', async () => {
    const products = await fetchFeaturedProducts();
    renderFeaturedProducts(products);
    
    // Add event listeners to Add to Cart buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            e.preventDefault();
            const product = JSON.parse(e.target.dataset.product.replace(/&#39;/g, "'"));
            if (window.cart) {
                window.cart.addItem({
                    id: product.id || Date.now(),
                    name: product.name,
                    price: product.price,
                    image: product.image
                });
            }
        }
    });
});
