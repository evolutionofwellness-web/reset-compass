// js/modal.js
// Accessible modal component with focus trap, ESC to close, and optimized scrolling
// Replaces reliance on native <dialog> with more controlled behavior

(function(){
  'use strict';

  /**
   * Modal class - Manages accessible modal dialogs
   */
  class Modal {
    constructor(options = {}) {
      this.id = options.id || `modal-${Date.now()}`;
      this.content = options.content || '';
      this.onClose = options.onClose || null;
      this.onOpen = options.onOpen || null;
      this.closeOnBackdrop = options.closeOnBackdrop !== false; // Default true
      this.closeOnEsc = options.closeOnEsc !== false; // Default true
      this.ariaLabel = options.ariaLabel || 'Dialog';
      
      this.element = null;
      this.backdrop = null;
      this.previousFocus = null;
      this.isOpen = false;
      
      this.handleKeyDown = this.handleKeyDown.bind(this);
      this.handleBackdropClick = this.handleBackdropClick.bind(this);
      this.close = this.close.bind(this);
    }

    /**
     * Create modal DOM structure
     */
    create() {
      if (this.element) return;

      // Create backdrop
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'modal-backdrop';
      this.backdrop.setAttribute('aria-hidden', 'true');
      
      // Create modal container
      this.element = document.createElement('div');
      this.element.id = this.id;
      this.element.className = 'modal';
      this.element.setAttribute('role', 'dialog');
      this.element.setAttribute('aria-modal', 'true');
      this.element.setAttribute('aria-label', this.ariaLabel);
      this.element.setAttribute('tabindex', '-1');

      // Create modal content wrapper
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'modal-content';
      contentWrapper.innerHTML = this.content;

      this.element.appendChild(contentWrapper);

      // Wire up events
      if (this.closeOnBackdrop) {
        this.backdrop.addEventListener('click', this.handleBackdropClick);
      }

      return this;
    }

    /**
     * Open the modal
     */
    open() {
      if (this.isOpen) return;

      if (!this.element) {
        this.create();
      }

      // Save current focus
      this.previousFocus = document.activeElement;

      // Append to body
      document.body.appendChild(this.backdrop);
      document.body.appendChild(this.element);

      // Disable body scroll
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');

      // Trigger reflow for animation
      this.backdrop.offsetHeight;
      this.element.offsetHeight;

      // Add active classes
      this.backdrop.classList.add('modal-backdrop--active');
      this.element.classList.add('modal--active');

      // Set focus to modal
      requestAnimationFrame(() => {
        this.element.focus();
        this.trapFocus();
      });

      // Add keyboard listener
      if (this.closeOnEsc) {
        document.addEventListener('keydown', this.handleKeyDown);
      }

      this.isOpen = true;

      // Call onOpen callback
      if (this.onOpen) {
        this.onOpen(this);
      }

      return this;
    }

    /**
     * Close the modal
     */
    close() {
      if (!this.isOpen) return;

      // Remove active classes (triggers CSS transition)
      this.backdrop.classList.remove('modal-backdrop--active');
      this.element.classList.remove('modal--active');

      // Wait for animation to complete
      setTimeout(() => {
        // Remove from DOM
        if (this.backdrop.parentNode) {
          this.backdrop.parentNode.removeChild(this.backdrop);
        }
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }

        // Restore body scroll
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');

        // Restore focus
        if (this.previousFocus && this.previousFocus.focus) {
          this.previousFocus.focus();
        }

        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleKeyDown);

        this.isOpen = false;

        // Call onClose callback
        if (this.onClose) {
          this.onClose(this);
        }
      }, 300); // Match CSS transition duration

      return this;
    }

    /**
     * Handle ESC key press
     */
    handleKeyDown(e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        this.close();
      }
    }

    /**
     * Handle backdrop click
     */
    handleBackdropClick(e) {
      if (e.target === this.backdrop) {
        this.close();
      }
    }

    /**
     * Trap focus within modal
     */
    trapFocus() {
      if (!this.element) return;

      const focusableElements = this.element.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      // Focus first element
      firstFocusable.focus();

      // Add focus trap listener
      this.element.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' && e.keyCode !== 9) return;

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      });
    }

    /**
     * Update modal content
     */
    setContent(content) {
      this.content = content;
      if (this.element) {
        const contentWrapper = this.element.querySelector('.modal-content');
        if (contentWrapper) {
          contentWrapper.innerHTML = content;
        }
      }
      return this;
    }

    /**
     * Destroy modal completely
     */
    destroy() {
      if (this.isOpen) {
        this.close();
      }
      
      // Clean up event listeners
      if (this.backdrop) {
        this.backdrop.removeEventListener('click', this.handleBackdropClick);
      }
      
      this.element = null;
      this.backdrop = null;
    }
  }

  // Export to global scope
  window.Modal = Modal;

})();
