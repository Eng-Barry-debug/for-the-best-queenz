// Admin component loader - loads header and sidebar components
document.addEventListener('DOMContentLoaded', function() {
    // Get the base path
    const basePath = window.location.pathname.includes('/admin/') 
        ? window.location.pathname.split('/admin/')[0] + '/admin/'
        : '/admin/';

    // Set a small timeout to ensure the DOM is fully loaded
    setTimeout(() => {
        loadAdminSidebar(basePath);
        loadAdminHeader(basePath);
        
        // Set a small delay to ensure components are loaded before setting up event listeners
        setTimeout(setupEventListeners, 100);
    }, 50);
});

async function loadAdminSidebar(basePath = '') {
    try {
        const response = await fetch(`${basePath}includes/sidebar.html`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading admin sidebar:', error);
        // Fallback to console message if UI update fails
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = `
                <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p class="font-bold">Error Loading Sidebar</p>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

async function loadAdminHeader(basePath = '') {
    try {
        const response = await fetch(`${basePath}includes/header.html`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading admin header:', error);
        // Fallback to console message if UI update fails
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = `
                <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p class="font-bold">Error Loading Header</p>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}

function setupEventListeners() {
    // Setup sidebar toggle for mobile
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
}

// Sidebar toggle functions
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && sidebarOverlay) {
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        } else {
            closeSidebar();
        }
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && sidebarOverlay) {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }
}

// Make functions globally available
window.loadAdminSidebar = loadAdminSidebar;
window.loadAdminHeader = loadAdminHeader;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;