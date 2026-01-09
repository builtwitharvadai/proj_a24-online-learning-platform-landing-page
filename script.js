/**
 * Interactive Navigation and Smooth Scrolling
 * Implements smooth scrolling behavior and mobile hamburger menu functionality
 * with progressive enhancement and accessibility support
 */

(function() {
  'use strict';

  // Feature detection for smooth scrolling support
  const supportsNativeSmoothScroll = 'scrollBehavior' in document.documentElement.style;

  /**
   * Initialize navigation functionality
   */
  function initNavigation() {
    const nav = document.querySelector('nav');
    const navLinks = document.querySelectorAll('nav ul li a');
    const hamburger = createHamburgerMenu();
    const navMenu = document.querySelector('nav ul');

    if (!nav || !navLinks.length || !navMenu) {
      console.warn('Navigation elements not found');
      return;
    }

    // Insert hamburger menu button
    nav.insertBefore(hamburger, navMenu);

    // Setup smooth scrolling for navigation links
    setupSmoothScrolling(navLinks, navMenu, hamburger);

    // Setup mobile menu toggle
    setupMobileMenu(hamburger, navMenu);

    // Setup active state tracking
    setupActiveStateTracking(navLinks);

    // Setup keyboard navigation
    setupKeyboardNavigation(hamburger, navMenu);
  }

  /**
   * Create hamburger menu button element
   * @returns {HTMLButtonElement} Hamburger button element
   */
  function createHamburgerMenu() {
    const button = document.createElement('button');
    button.className = 'hamburger';
    button.setAttribute('aria-label', 'Toggle navigation menu');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'nav-menu');

    // Create hamburger icon spans
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      button.appendChild(span);
    }

    return button;
  }

  /**
   * Setup smooth scrolling behavior for navigation links
   * @param {NodeList} navLinks - Navigation link elements
   * @param {HTMLElement} navMenu - Navigation menu element
   * @param {HTMLElement} hamburger - Hamburger button element
   */
  function setupSmoothScrolling(navLinks, navMenu, hamburger) {
    navLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        const href = link.getAttribute('href');
        
        // Only handle internal anchor links
        if (!href || !href.startsWith('#')) {
          return;
        }

        event.preventDefault();

        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (!targetElement) {
          console.warn(`Target element not found: ${targetId}`);
          return;
        }

        // Close mobile menu if open
        if (navMenu.classList.contains('active')) {
          closeMobileMenu(navMenu, hamburger);
        }

        // Perform smooth scroll
        smoothScrollTo(targetElement);

        // Update URL without triggering scroll
        if (history.pushState) {
          history.pushState(null, null, href);
        } else {
          window.location.hash = href;
        }

        // Set focus to target for accessibility
        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus();
      });
    });
  }

  /**
   * Smooth scroll to target element with fallback
   * @param {HTMLElement} element - Target element to scroll to
   */
  function smoothScrollTo(element) {
    if (supportsNativeSmoothScroll) {
      // Use native smooth scrolling
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // Fallback for browsers without native support
      smoothScrollPolyfill(element);
    }
  }

  /**
   * Polyfill for smooth scrolling in older browsers
   * @param {HTMLElement} element - Target element to scroll to
   */
  function smoothScrollPolyfill(element) {
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 800;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) {
        startTime = currentTime;
      }

      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    }

    requestAnimationFrame(animation);
  }

  /**
   * Setup mobile menu toggle functionality
   * @param {HTMLElement} hamburger - Hamburger button element
   * @param {HTMLElement} navMenu - Navigation menu element
   */
  function setupMobileMenu(hamburger, navMenu) {
    navMenu.setAttribute('id', 'nav-menu');

    hamburger.addEventListener('click', () => {
      const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        closeMobileMenu(navMenu, hamburger);
      } else {
        openMobileMenu(navMenu, hamburger);
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      const isClickInside = hamburger.contains(event.target) || navMenu.contains(event.target);
      
      if (!isClickInside && navMenu.classList.contains('active')) {
        closeMobileMenu(navMenu, hamburger);
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navMenu.classList.contains('active')) {
        closeMobileMenu(navMenu, hamburger);
        hamburger.focus();
      }
    });
  }

  /**
   * Open mobile navigation menu
   * @param {HTMLElement} navMenu - Navigation menu element
   * @param {HTMLElement} hamburger - Hamburger button element
   */
  function openMobileMenu(navMenu, hamburger) {
    navMenu.classList.add('active');
    hamburger.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close mobile navigation menu
   * @param {HTMLElement} navMenu - Navigation menu element
   * @param {HTMLElement} hamburger - Hamburger button element
   */
  function closeMobileMenu(navMenu, hamburger) {
    navMenu.classList.remove('active');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  /**
   * Setup active state tracking for navigation items
   * @param {NodeList} navLinks - Navigation link elements
   */
  function setupActiveStateTracking(navLinks) {
    const sections = Array.from(navLinks)
      .map(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const id = href.substring(1);
          return document.getElementById(id);
        }
        return null;
      })
      .filter(Boolean);

    if (sections.length === 0) {
      return;
    }

    // Throttle scroll event for performance
    let ticking = false;

    function updateActiveState() {
      const scrollPosition = window.pageYOffset + 100;

      let currentSection = null;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          currentSection = section;
        }
      });

      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentSection && href === `#${currentSection.id}`) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        } else {
          link.classList.remove('active');
          link.removeAttribute('aria-current');
        }
      });

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateActiveState);
        ticking = true;
      }
    });

    // Initial update
    updateActiveState();
  }

  /**
   * Setup keyboard navigation for accessibility
   * @param {HTMLElement} hamburger - Hamburger button element
   * @param {HTMLElement} navMenu - Navigation menu element
   */
  function setupKeyboardNavigation(hamburger, navMenu) {
    const navLinks = navMenu.querySelectorAll('a');
    
    navMenu.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        const firstLink = navLinks[0];
        const lastLink = navLinks[navLinks.length - 1];
        
        // Trap focus within menu when open on mobile
        if (window.innerWidth < 768 && navMenu.classList.contains('active')) {
          if (event.shiftKey && document.activeElement === firstLink) {
            event.preventDefault();
            hamburger.focus();
          } else if (!event.shiftKey && document.activeElement === lastLink) {
            event.preventDefault();
            hamburger.focus();
          }
        }
      }
    });
  }

  /**
   * Initialize on DOM ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigation);
  } else {
    initNavigation();
  }

})();