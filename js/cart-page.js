// Cart Page Functionality
document.addEventListener('DOMContentLoaded', () => {
    const cart = window.cart || new Cart();
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const checkoutButton = document.getElementById('checkout-button');
    const updateCartButton = document.getElementById('update-cart');
    const checkoutForm = document.getElementById('checkout-form');
    const deliveryForm = document.getElementById('delivery-form');

    // Render cart items
    function renderCartItems() {
        const items = cart.getItems();
        
        if (items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="p-8 text-center">
                    <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 class="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
                    <p class="mt-1 text-gray-500">Start shopping to add items to your cart</p>
                    <div class="mt-6">
                        <a href="products.html" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
                            Continue Shopping
                        </a>
                    </div>
                </div>`;
            checkoutButton.disabled = true;
            return;
        }

        cartItemsContainer.innerHTML = `
            <div class="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <div class="col-span-5">Product</div>
                <div class="col-span-2 text-center">Price</div>
                <div class="col-span-2 text-center">Quantity</div>
                <div class="col-span-2 text-center">Total</div>
                <div class="col-span-1"></div>
            </div>`;

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'grid grid-cols-2 md:grid-cols-12 gap-4 p-6 items-center border-b border-gray-200';
            itemElement.innerHTML = `
                <div class="col-span-2 md:col-span-5 flex items-center">
                    <div class="flex-shrink-0 h-20 w-20 overflow-hidden rounded-md border border-gray-200">
                        <img src="${item.image || 'https://via.placeholder.com/150'}" alt="${item.name}" class="h-full w-full object-cover object-center">
                    </div>
                    <div class="ml-4">
                        <h3 class="text-sm font-medium text-gray-900">${item.name}</h3>
                        <p class="text-sm text-gray-500">${item.variant || 'Standard'}</p>
                    </div>
                </div>
                <div class="col-span-1 md:col-span-2 text-sm text-gray-900 text-center">
                    KSH ${(parseFloat(item.price) || 0).toFixed(2)}
                </div>
                <div class="col-span-1 md:col-span-2">
                    <div class="flex items-center justify-center">
                        <button class="quantity-btn p-1 text-gray-500 hover:text-pink-600" data-action="decrease" data-id="${item.id}">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                            </svg>
                        </button>
                        <input type="number" min="1" value="${item.quantity}" data-id="${item.id}" 
                               class="mx-2 w-12 text-center border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm">
                        <button class="quantity-btn p-1 text-gray-500 hover:text-pink-600" data-action="increase" data-id="${item.id}">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="col-span-1 md:col-span-2 text-sm font-medium text-gray-900 text-center">
                    KSH ${((parseFloat(item.price) || 0) * item.quantity).toFixed(2)}
                </div>
                <div class="col-span-1 flex justify-end">
                    <button class="remove-item text-gray-400 hover:text-red-500" data-id="${item.id}">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>`;
            
            cartItemsContainer.appendChild(itemElement);
        });

        // Update subtotal
        const subtotal = items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0);
        cartSubtotal.textContent = `KSH ${subtotal.toFixed(2)}`;
        checkoutButton.disabled = false;
    }

    // Handle quantity changes
    function handleQuantityChange(id, change) {
        const item = cart.getItems().find(item => item.id === id);
        if (item) {
            const newQuantity = item.quantity + change;
            if (newQuantity > 0) {
                cart.updateQuantity(id, newQuantity);
                renderCartItems();
            }
        }
    }

    // Event delegation for quantity buttons
    cartItemsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.quantity-btn');
        if (button) {
            e.preventDefault();
            const id = button.dataset.id;
            const action = button.dataset.action;
            
            if (action === 'increase') {
                handleQuantityChange(id, 1);
            } else if (action === 'decrease') {
                handleQuantityChange(id, -1);
            }
        }

        // Handle remove item
        const removeButton = e.target.closest('.remove-item');
        if (removeButton) {
            e.preventDefault();
            const id = removeButton.dataset.id;
            cart.removeItem(id);
            renderCartItems();
        }
    });

    // Handle quantity input changes
    cartItemsContainer.addEventListener('change', (e) => {
        if (e.target.matches('input[type="number"]')) {
            const id = e.target.dataset.id;
            const quantity = parseInt(e.target.value);
            
            if (!isNaN(quantity) && quantity > 0) {
                cart.updateQuantity(id, quantity);
                renderCartItems();
            }
        }
    });

    // Update cart button
    updateCartButton.addEventListener('click', (e) => {
        e.preventDefault();
        renderCartItems();
    });

    // Checkout button
    checkoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        checkoutForm.classList.remove('hidden');
        checkoutForm.scrollIntoView({ behavior: 'smooth' });
    });

    // Handle form submission
    deliveryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value || 'Not provided';
        const address = document.getElementById('address').value;
        const notes = document.getElementById('notes').value || 'No special instructions';
        
        // Format order details for WhatsApp
        const items = cart.getItems();
        const orderItems = items.map(item =>
            `- ${item.name} x${item.quantity} @ KSH ${(parseFloat(item.price) || 0).toFixed(2)}`
        ).join('%0A');

        const subtotal = items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0);
        
        // Create WhatsApp message
        const message = `*NEW ORDER*%0A%0A` +
            `*Customer Details*%0A` +
            `Name: ${name}%0A` +
            `Phone: ${phone}%0A` +
            `Email: ${email}%0A` +
            `Address: ${address}%0A` +
            `Notes: ${notes}%0A%0A` +
            `*Order Details*%0A${orderItems}%0A%0A` +
            `*Subtotal: KSH ${subtotal.toFixed(2)}*`;
        
        // Show loading state
        const submitButton = deliveryForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending Order...`;

        // Open WhatsApp with pre-filled message
        const whatsappUrl = `https://wa.me/254722334257?text=${message}`;
        
        // Show confirmation message
        setTimeout(() => {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
            successMessage.innerHTML = `
                <div class="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
                    <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                        <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 class="mt-4 text-xl font-medium text-gray-900">Order Submitted!</h3>
                    <div class="mt-2">
                        <p class="text-sm text-gray-500">
                            We've received your order and will contact you shortly on WhatsApp to confirm the details.
                        </p>
                    </div>
                    <div class="mt-6">
                        <a href="${whatsappUrl}" target="_blank" class="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            <svg class="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                            </svg>
                            Open WhatsApp
                        </a>
                        <button type="button" class="ml-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500" onclick="this.closest('div[role=dialog]').remove();">
                            Continue Shopping
                        </button>
                    </div>
                </div>`;
            
            document.body.appendChild(successMessage);
            
            // Clear cart and reset form
            cart.clear();
            deliveryForm.reset();
            checkoutForm.classList.add('hidden');
            renderCartItems();
            
            // Close modal when clicking outside
            successMessage.addEventListener('click', (e) => {
                if (e.target === successMessage) {
                    successMessage.remove();
                }
            });
            
            // Auto-close after 10 seconds
            setTimeout(() => {
                if (document.body.contains(successMessage)) {
                    successMessage.remove();
                }
            }, 10000);
            
        }, 1500); // Short delay to show loading state
    });

    // Initial render
    renderCartItems();
});
