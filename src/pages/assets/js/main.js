/**
 * Main JavaScript File
 * Initializes all components and functionality for the site
 */

// For browsers that don't support ES modules natively
// We'll use a simpler approach without import/export

document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile navigation
    initMobileNavigation();

    // Add smooth scrolling for anchor links
    initSmoothScrolling();

    // Phone Animation
    const phoneImage = document.querySelector('.phone-image');
    const phoneFrame = document.querySelector('.phone-frame');
    const phoneSection = document.querySelector('.phone-animation-section');
    
    if (phoneImage && phoneSection) {
        // Initial phone position (more upright, facing user)
        phoneImage.style.transform = 'rotateX(50deg) rotateY(0deg) rotateZ(0deg)';
        
        // Handle scroll animation
        window.addEventListener('scroll', function() {
            // Get phone section position
            const phoneRect = phoneSection.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Calculate how far the phone is through the viewport
            const scrollProgress = 1 - (phoneRect.top / windowHeight);
            
            // Only animate when phone is in view and not past the end point
            if (scrollProgress > 0 && scrollProgress < 1) {
                // Map scroll position to rotation angles
                // The phone will go from 50deg to 0deg and then stay flat
                const rotateX = Math.max(0, 50 - (scrollProgress * 100)); // 50deg to 0deg
                
                // Apply transform
                phoneImage.style.transform = `rotateX(${rotateX}deg) rotateY(0deg) rotateZ(0deg)`;
                
                // Add scale effect as it flattens
                const scale = 1 + (Math.min(0.5, scrollProgress) * 0.2); // Scale from 1 to 1.1, capped
                phoneImage.style.transform += ` scale(${scale})`;
            }
        });
        
        // Trigger initial position
        window.dispatchEvent(new Event('scroll'));
    }

    // FAQ Accordion - Fixed implementation
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            if (question) {
                question.addEventListener('click', function() {
                    const isActive = item.classList.contains('active');
                    
                    // Close all other items
                    faqItems.forEach(otherItem => {
                        otherItem.classList.remove('active');
                    });
                    
                    // If the clicked item wasn't already active, make it active
                    if (!isActive) {
                        item.classList.add('active');
                    }
                });
            }
        });
        
        // Open the first FAQ item by default
        faqItems[0].classList.add('active');
    }
});

/**
 * Initialize mobile navigation
 */
function initMobileNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            console.log('Menu toggle clicked!'); // Add debug logging
            navLinks.classList.toggle('active');
        });
    }

    navLinksItems.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
        });
    });
}

/**
 * Add smooth scrolling for anchor links
 */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Account for header height
                    behavior: 'smooth'
                });
            }
        });
    });
} 