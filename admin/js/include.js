// Admin include loader - loads sidebar and header components dynamically
document.addEventListener('DOMContentLoaded', function() {
    loadAdminSidebar();
    loadAdminHeader();
});

async function loadAdminSidebar() {
    try {
        const response = await fetch('includes/sidebar.html');
        const html = await response.text();
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading admin sidebar:', error);
        // Fallback: show error message
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            sidebarContainer.innerHTML = '<div class="p-4 text-red-600">Error loading sidebar</div>';
        }
    }
}

async function loadAdminHeader() {
    try {
        const response = await fetch('includes/header.html');
        const html = await response.text();
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading admin header:', error);
        // Fallback: show error message
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            headerContainer.innerHTML = '<div class="p-4 text-red-600">Error loading header</div>';
        }
    }
}

// Make functions globally available if needed
window.loadAdminSidebar = loadAdminSidebar;
window.loadAdminHeader = loadAdminHeader;