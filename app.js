// ---- Robust splash reveal: replace older splash handling with this block ----
(function setupSplashReveal() {
  // call this from DOMContentLoaded initialization
  function attachReveal() {
    try {
      const splash = document.getElementById('splash-screen');
      const splashIcon = document.getElementById('splash-icon');
      const appRoot = document.getElementById('app-root') || document.getElementById('page') || document.body;

      // helper that performs the actual reveal once
      let revealed = false;
      function doReveal() {
        if (revealed) return;
        revealed = true;
        try {
          if (splash) {
            splash.classList.add('hidden');
            splash.style.pointerEvents = 'none';
          }
        } catch(e){ /* ignore */ }
        // small overlap so splash fades while app fades in
        try { 
          if (appRoot) {
            // schedule micro-delay so the fade-out starts first and the crossfade looks smooth
            setTimeout(()=> {
              appRoot.classList.add('visible');
              appRoot.setAttribute('aria-hidden','false');
            }, 40);
          }
        } catch(e){}
        // clean up the splash element after transitions complete (safety timeout)
        setTimeout(() => {
          try { if (splash && splash.parentNode) splash.parentNode.removeChild(splash); } catch(e){}
        }, 900);
      }

      // If animationend fires on the icon, reveal immediately
      if (splashIcon && splash) {
        try {
          splashIcon.addEventListener('animationend', doReveal, { once: true });
        } catch(e) { /* ignore attach failure */ }
      }

      // Also reveal if the splash's opacity transition ends (robustness)
      if (splash) {
        try {
          splash.addEventListener('transitionend', (ev) => {
            if (ev.propertyName === 'opacity') doReveal();
          }, { once: true });
        } catch(e){}
      }

      // Also reveal on window load as a fallback (covers skipped animations)
      window.addEventListener('load', doReveal, { once: true });

      // Final fallback: ensure we reveal after 3000ms no matter what
      setTimeout(doReveal, 3000);
    } catch(err) {
      // If anything fails here, make sure we still reveal the app so user isn't stuck
      try {
        const appRoot = document.getElementById('app-root') || document.getElementById('page') || document.body;
        if (appRoot) { appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); }
        const splash = document.getElementById('splash-screen');
        if (splash && splash.parentNode) try { splash.parentNode.removeChild(splash); } catch(e){}
      } catch(e){}
    }
  }

  // Expose for manual call (useful for debugging)
  window.__revealAppNow = attachReveal;
  // Call it immediately if DOMContentLoaded has already fired
  if (document.readyState === 'complete' || document.readyState === 'interactive') attachReveal();
  else document.addEventListener('DOMContentLoaded', attachReveal, { once: true });
})();