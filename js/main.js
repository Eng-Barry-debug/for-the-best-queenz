// Main JavaScript for general interactions
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Close mobile menu when clicking outside or on a link
    document.addEventListener('click', function(event) {
        const currentMobileMenuButton = document.getElementById('mobile-menu-button');
        const currentMobileMenu = document.getElementById('mobile-menu');
        if (currentMobileMenuButton && currentMobileMenu && !currentMobileMenuButton.contains(event.target) && !currentMobileMenu.contains(event.target)) {
            currentMobileMenu.classList.add('hidden');
        }
    });

    // Update copyright year
    const currentYear = new Date().getFullYear();
    const copyrightElements = document.querySelectorAll('p');
    copyrightElements.forEach(element => {
        if (element.textContent.includes('© 2023 For The Best_Queenz')) {
            element.textContent = element.textContent.replace('© 2023', `© ${currentYear}`);
        }
    });

    // Add any other general interactions here
});