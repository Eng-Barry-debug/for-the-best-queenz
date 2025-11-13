// Common functions for admin panel

// Utility functions
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg`;
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-400 hover:text-gray-600">&times;</button>
        </div>
    `;

    // Add color based on type
    if (type === 'success') {
        alertDiv.classList.add('bg-green-100', 'text-green-800', 'border-green-500');
    } else if (type === 'error') {
        alertDiv.classList.add('bg-red-100', 'text-red-800', 'border-red-500');
    } else {
        alertDiv.classList.add('bg-blue-100', 'text-blue-800', 'border-blue-500');
    }

    document.body.appendChild(alertDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

function confirmAction(message) {
    return confirm(message);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function sanitizeInput(input) {
    return input.replace(/[<>]/g, '');
}

function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
}

// Image upload helper
function validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        showAlert('Please select a valid image file (JPEG, PNG, GIF)', 'error');
        return false;
    }

    if (file.size > maxSize) {
        showAlert('Image size should be less than 5MB', 'error');
        return false;
    }

    return true;
}

// Loading spinner
function showLoading(element) {
    element.innerHTML = `
        <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
            <span class="ml-2">Loading...</span>
        </div>
    `;
}

function hideLoading(element, originalContent) {
    element.innerHTML = originalContent;
}

// Set page title function
function setPageTitle(title) {
    const titleElement = document.getElementById('page-title');
    if (titleElement) {
        titleElement.textContent = title;
    }
    document.title = `${title} - For The Best Queenz Admin`;
}

// Export functions for Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setPageTitle,
        showAlert,
        confirmAction,
        formatDate,
        formatCurrency,
        validateEmail,
        sanitizeInput,
        generateSlug,
        validateImageFile,
        showLoading,
        hideLoading
    };
}