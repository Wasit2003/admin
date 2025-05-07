/**
 * Navigation Component
 * Handles mobile menu toggle and navigation behavior
 */

class Navigation {
    constructor() {
        this.menuToggle = document.querySelector('.menu-toggle');
        this.navLinks = document.querySelector('.nav-links');
        this.navLinksItems = document.querySelectorAll('.nav-links a');
        
        this.init();
    }

    init() {
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => this.toggleMenu());
        }
        
        this.navLinksItems.forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });
    }

    toggleMenu() {
        this.navLinks.classList.toggle('active');
    }

    closeMenu() {
        this.navLinks.classList.remove('active');
    }
}

export default Navigation; 