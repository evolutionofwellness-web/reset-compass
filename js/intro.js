// intro.js - Cinematic intro overlay
// Shows on first visit per session (respects prefers-reduced-motion)

(function(){
  'use strict';

  const SESSION_KEY = 'introPlayed';
  
  function shouldShowIntro(){
    // Skip if already played this session
    if (sessionStorage.getItem(SESSION_KEY)) return false;
    
    // Skip if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    
    // Skip if on onboarding page
    if (document.body.classList.contains('page-onboarding')) return false;
    
    return true;
  }

  function showIntro(){
    if (!shouldShowIntro()) return;

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // Create intro overlay
    const overlay = document.createElement('div');
    overlay.className = 'intro-overlay';
    overlay.innerHTML = `
      <div class="intro-content">
        <div class="intro-logo">🧭</div>
        <h1 class="intro-title">The Reset Compass</h1>
        <p class="intro-subtitle">Find your wellness mode</p>
        <div class="intro-spinner"></div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Wait for modes to load, then fade out
    const removeIntro = () => {
      setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
          // Unlock body scroll
          document.body.style.overflow = '';
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.height = '';
        }, 800);
      }, 1200); // Show for at least 1.2s
      
      sessionStorage.setItem(SESSION_KEY, 'true');
    };

    // Listen for modes loaded event
    if (window.MODES && window.MODES.length > 0) {
      removeIntro();
    } else {
      window.addEventListener('modes:loaded', removeIntro, { once: true });
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showIntro);
  } else {
    showIntro();
  }
})();
