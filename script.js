/**
 * Main JavaScript file with performance optimizations and error handling
 * Implements lazy loading, smooth scrolling, and feature detection
 */

(function() {
  'use strict';

  // Feature Detection
  const features = {
    intersectionObserver: 'IntersectionObserver' in window,
    smoothScroll: 'scrollBehavior' in document.documentElement.style,
    webP: false
  };

  // Check WebP support
  function checkWebPSupport() {
    const elem = document.createElement('canvas');
    if (elem.getContext && elem.getContext('2d')) {
      features.webP = elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
  }
  checkWebPSupport();

  /**
   * Debounce function for performance optimization
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function for performance optimization
   * @param {Function} func - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Smooth scroll implementation with error handling and fallback
   * @param {string} target - Target element selector
   * @param {number} offset - Offset from top in pixels
   */
  function smoothScroll(target, offset = 0) {
    try {
      const element = document.querySelector(target);
      if (!element) {
        console.warn(`Smooth scroll target not found: ${target}`);
        return;
      }

      const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;

      if (features.smoothScroll) {
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      } else {
        // Fallback for browsers without smooth scroll support
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 800;
        let start = null;

        function animation(currentTime) {
          if (start === null) start = currentTime;
          const timeElapsed = currentTime - start;
          const run = ease(timeElapsed, startPosition, distance, duration);
          window.scrollTo(0, run);
          if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t, b, c, d) {
          t /= d / 2;
          if (t < 1) return c / 2 * t * t + b;
          t--;
          return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
      }
    } catch (error) {
      console.error('Error in smooth scroll:', error);
    }
  }

  /**
   * Lazy loading implementation using Intersection Observer
   */
  function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
    
    if (!lazyImages.length) return;

    if (features.intersectionObserver) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            try {
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
              }
              
              if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
                img.removeAttribute('data-srcset');
              }

              img.classList.add('loaded');
              observer.unobserve(img);
            } catch (error) {
              console.error('Error loading lazy image:', error);
            }
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without Intersection Observer
      lazyImages.forEach(img => {
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
      });
    }
  }

  /**
   * Initialize smooth scroll for anchor links
   */
  function initSmoothScrollLinks() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        if (href === '#' || href === '#!') return;
        
        e.preventDefault();
        smoothScroll(href, 80);
        
        // Update URL without jumping
        if (history.pushState) {
          history.pushState(null, null, href);
        }
      });
    });
  }

  /**
   * Optimize animations using requestAnimationFrame
   */
  function initOptimizedAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    if (!animatedElements.length || !features.intersectionObserver) return;

    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            entry.target.classList.add('animate-in');
          });
          animationObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });

    animatedElements.forEach(el => animationObserver.observe(el));
  }

  /**
   * Preload critical resources
   */
  function preloadCriticalResources() {
    const criticalImages = document.querySelectorAll('img[data-preload]');
    
    criticalImages.forEach(img => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.dataset.preload || img.src;
      document.head.appendChild(link);
    });
  }

  /**
   * Handle scroll events with throttling
   */
  function initScrollHandler() {
    const header = document.querySelector('header');
    if (!header) return;

    const handleScroll = throttle(() => {
      try {
        const scrolled = window.pageYOffset > 100;
        header.classList.toggle('scrolled', scrolled);
      } catch (error) {
        console.error('Error in scroll handler:', error);
      }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * Initialize form validation with error handling
   */
  function initFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');
    
    forms.forEach(form => {
      form.addEventListener('submit', function(e) {
        try {
          const inputs = form.querySelectorAll('input[required], textarea[required]');
          let isValid = true;

          inputs.forEach(input => {
            if (!input.value.trim()) {
              isValid = false;
              input.classList.add('error');
              input.setAttribute('aria-invalid', 'true');
            } else {
              input.classList.remove('error');
              input.setAttribute('aria-invalid', 'false');
            }
          });

          if (!isValid) {
            e.preventDefault();
            const firstError = form.querySelector('.error');
            if (firstError) firstError.focus();
          }
        } catch (error) {
          console.error('Error in form validation:', error);
        }
      });
    });
  }

  /**
   * Initialize all functionality when DOM is ready
   */
  function init() {
    try {
      preloadCriticalResources();
      initLazyLoading();
      initSmoothScrollLinks();
      initOptimizedAnimations();
      initScrollHandler();
      initFormValidation();

      // Dispatch custom event when initialization is complete
      document.dispatchEvent(new CustomEvent('appInitialized', {
        detail: { features }
      }));
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose public API
  window.App = {
    smoothScroll,
    features,
    debounce,
    throttle
  };

})();