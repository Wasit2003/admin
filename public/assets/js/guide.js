document.addEventListener('DOMContentLoaded', function() {
    // Get all text steps and phone screen states
    const textSteps = document.querySelectorAll('.sticky-phone-text-step');
    const phoneScreens = document.querySelectorAll('.phone-screen-state');
    
    // Create Intersection Observer for text steps
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Get the step number from the data attribute
                const stepNumber = entry.target.dataset.step;
                
                // Update active states
                textSteps.forEach(step => step.classList.remove('active'));
                phoneScreens.forEach(screen => screen.classList.remove('active'));
                
                // Activate current step and corresponding phone screen
                entry.target.classList.add('active');
                document.querySelector(`.phone-screen-state[data-step="${stepNumber}"]`).classList.add('active');
            }
        });
    }, {
        threshold: 0.5, // Trigger when 50% of the element is visible
        rootMargin: '-100px 0px' // Adjust based on header height
    });

    // Observe each text step
    textSteps.forEach(step => observer.observe(step));

    // Handle RTL layout adjustments
    const isRTL = document.documentElement.dir === 'rtl';
    const phoneMockup = document.querySelector('.sticky-phone-mockup');
    
    if (isRTL) {
        // Adjust sticky positioning for RTL
        phoneMockup.style.right = '0';
    } else {
        phoneMockup.style.left = '0';
    }

    // Handle scroll animations
    let lastScrollTop = 0;
    const phoneFrame = document.querySelector('.phone-frame');

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add subtle movement to phone frame
        if (scrollTop > lastScrollTop) {
            phoneFrame.style.transform = 'translateY(10px)';
        } else {
            phoneFrame.style.transform = 'translateY(-10px)';
        }
        
        lastScrollTop = scrollTop;
    });

    // Handle responsive behavior
    function handleResponsive() {
        const isMobile = window.innerWidth <= 1024;
        const container = document.querySelector('.sticky-phone-container');
        const phoneWrapper = document.querySelector('.sticky-phone-wrapper');
        
        if (isMobile) {
            // Create mobile-friendly view with phones visible for each section
            if (!document.querySelector('.mobile-phones-added')) {
                // Add phone images to each text step for mobile
                textSteps.forEach(step => {
                    const stepNumber = step.dataset.step;
                    const phoneImg = document.querySelector(`.phone-screen-state[data-step="${stepNumber}"] img`).cloneNode(true);
                    
                    // Create a container for the phone
                    const phoneContainer = document.createElement('div');
                    phoneContainer.className = 'mobile-phone-container';
                    phoneContainer.style.marginTop = '2rem';
                    phoneContainer.style.display = 'flex';
                    phoneContainer.style.justifyContent = 'center';
                    
                    phoneContainer.appendChild(phoneImg);
                    step.appendChild(phoneContainer);
                });
                
                // Hide the original phone mockup on mobile
                phoneMockup.style.display = 'none';
                
                // Mark that we've added the mobile phones
                phoneWrapper.classList.add('mobile-phones-added');
            }
            
            // Remove sticky behavior
            phoneMockup.style.position = 'relative';
            phoneMockup.style.top = '0';
            container.style.minHeight = 'auto';
        } else {
            // For desktop view, restore the sticky behavior
            // Remove mobile phone images if they exist
            document.querySelectorAll('.mobile-phone-container').forEach(el => {
                el.remove();
            });
            
            // Show the original phone mockup
            phoneMockup.style.display = 'flex';
            
            // Remove the marker class
            phoneWrapper.classList.remove('mobile-phones-added');
            
            // Re-enable sticky behavior on desktop
            phoneMockup.style.position = 'sticky';
            phoneMockup.style.top = '100px';
            container.style.minHeight = '100vh';
        }
    }

    // Initial check and add resize listener
    handleResponsive();
    window.addEventListener('resize', handleResponsive);
});