// js/spacing.js
// Central spacing tokens for consistent UI spacing throughout the app
// Use these tokens instead of hardcoded pixel values

(function(){
  'use strict';

  /**
   * Spacing scale based on 4px base unit
   * Provides consistent spacing throughout the application
   */
  const SPACING = {
    // Base unit
    xs: '4px',    // Extra small - 4px
    sm: '8px',    // Small - 8px
    md: '12px',   // Medium - 12px
    base: '16px', // Base - 16px (1rem)
    lg: '20px',   // Large - 20px
    xl: '24px',   // Extra large - 24px
    '2xl': '32px', // 2x extra large - 32px
    '3xl': '48px', // 3x extra large - 48px
    '4xl': '64px', // 4x extra large - 64px
    
    // Semantic spacing
    gutter: '16px',     // Default gutter between elements
    section: '32px',    // Section spacing
    cardPadding: '24px', // Card internal padding
    inputPadding: '12px', // Form input padding
    buttonPadding: '16px 24px', // Button padding
    
    // Component-specific
    modalPadding: '24px',
    dialogGap: '16px',
    gridGap: '16px',
    listItemGap: '12px'
  };

  /**
   * Helper function to get spacing value
   * @param {string} key - Spacing key
   * @returns {string} CSS spacing value
   */
  function getSpacing(key) {
    return SPACING[key] || SPACING.base;
  }

  /**
   * Helper to apply spacing to an element
   * @param {HTMLElement} element - Element to apply spacing to
   * @param {Object} config - Spacing configuration
   */
  function applySpacing(element, config) {
    if (!element) return;
    
    if (config.padding) element.style.padding = getSpacing(config.padding);
    if (config.margin) element.style.margin = getSpacing(config.margin);
    if (config.gap) element.style.gap = getSpacing(config.gap);
    if (config.paddingTop) element.style.paddingTop = getSpacing(config.paddingTop);
    if (config.paddingBottom) element.style.paddingBottom = getSpacing(config.paddingBottom);
    if (config.paddingLeft) element.style.paddingLeft = getSpacing(config.paddingLeft);
    if (config.paddingRight) element.style.paddingRight = getSpacing(config.paddingRight);
    if (config.marginTop) element.style.marginTop = getSpacing(config.marginTop);
    if (config.marginBottom) element.style.marginBottom = getSpacing(config.marginBottom);
  }

  // Export to global scope
  window.SPACING = SPACING;
  window.getSpacing = getSpacing;
  window.applySpacing = applySpacing;

})();
