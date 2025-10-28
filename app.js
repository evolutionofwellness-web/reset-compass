// app.js v109 — robust rebinds + guaranteed scroll rotation + diagnostics
// - Ensures needle group exists and is non-interactive
// - Robust RAF-driven scroll rotation with interval fallback
// - Delegated and per-element bindings with retries (idempotent)
// - Emits clear console logs for initialization and click events

(function(){
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/"/g,'\\"'); }

  window.__lastAppError = null;
  window.onerror = function(msg, url, line, col, err) {
    try { window.__lastAppError = { msg, url, line, col, err: (err && (err.stack || err.message)) || null, time: new Date().toISOString() }; } catch(e){}
    return false;
  };

  // Expose an init log flag so diagnostics can confirm the app started
  window.__appInitLogged = false;

  // MAIN INIT
  document.addEventListener('DOMContentLoaded', () => {
    try {
      // Basic elements
      const appRoot = document.getElementById('app-root');
      const compass = document.getElementById('compass');

      // Immediately show app root (no splash)
      if (appRoot) { appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); }

      // needleGroup may not be present at first render; helper to get it
      function getNeedleGroup() {
        return document.getElementById('needle-group') || null;
      }

      // Ensure needle is non-interactive and has idle class
      function ensureNeedleReady() {
        const ng = getNeedleGroup();
        if (!ng) return false;
        ng.style.pointerEvents = 'none';
        if (!ng.classList.contains('idle')) ng.classList.add('idle');
        return true;
      }
      ensureNeedleReady();

      // Scroll-driven rotation (RAF) with fallback interval to ensure rotation even if RAF gets paused
      let lastScrollY = 0;
      let rafScheduled = false;
      let scrollActive = false;
      let resumeTimer = null;
      let interactionPause = false;
      const ANGLE_MAX = 720;

      function onScrollEvent() {
        lastScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        if (!rafScheduled) {
          rafScheduled = true;
          window.requestAnimationFrame(processScroll);
        }
      }
      function processScroll() {
        rafScheduled = false;
        const ng = getNeedleGroup();
        if (!ng || interactionPause) return;
        const doc = document.documentElement;
        const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
        const ratio = Math.max(0, Math.min(1, lastScrollY / maxScroll));
        const angle = ratio * ANGLE_MAX;
        try {
          ng.classList.remove('idle');
          ng.style.transform = `rotate(${angle}deg)`;
        } catch(e) { /*ignore*/ }
        scrollActive = true;
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(()=>{ if (ng && !interactionPause) ng.classList.add('idle'); scrollActive = false; }, 420);
      }
      window.addEventListener('scroll', onScrollEvent, { passive:true });

      // Fallback interval to keep rotation responsive on platforms where RAF/scroll events may pause
      const fallbackInterval = setInterval(()=>{
        try {
          const ng = getNeedleGroup();
          if (!ng || interactionPause) return;
          // re-apply transform based on current scroll value (no heavy work)
          const doc = document.documentElement;
          const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
          const ratio = Math.max(0, Math.min(1, (window.scrollY||window.pageYOffset||0) / maxScroll));
          const angle = ratio * ANGLE_MAX;
          ng.style.transform = `rotate(${angle}deg)`;
        } catch(e){}
      }, 350);

      // Interaction pause helpers
      function setInteractionPause(on) {
        interactionPause = !!on;
        const ng = getNeedleGroup();
        if (!on) {
          clearTimeout(resumeTimer);
          resumeTimer = setTimeout(()=>{ if (ng && !interactionPause) ng.classList.add('idle'); }, 260);
        } else {
          clearTimeout(resumeTimer);
          if (ng) ng.classList.remove('idle');
        }
      }

      // Delegated click handling for wedges (reliable)
      if (compass) {
        compass.addEventListener('click', (e) => {
          try {
            // find path[data-mode] up the tree
            const path = e.target && (e.target.closest ? e.target.closest('path[data-mode]') : null);
            if (path) {
              const mode = path.getAttribute('data-mode');
              console.debug('[v109] delegated wedge click ->', mode);
              // visual bloom (safe)
              try { path.classList.add('bloom-strong'); setTimeout(()=>path.classList.remove('bloom-strong'), 620); } catch(e){}
              // selection spin then navigate
              const ng = getNeedleGroup();
              if (ng) {
                ng.classList.remove('idle');
                ng.classList.add('needle-spin');
                setTimeout(()=>{
                  ng.classList.remove('needle-spin');
                  ng.classList.add('idle');
                  navigateMode(mode);
                  setInteractionPause(false);
                }, 560);
              } else {
                navigateMode(mode);
                setInteractionPause(false);
              }
            }
          } catch(err) {
            console.warn('[v109] delegated click handler error', err);
          }
        });
      }

      // Per-element binding (idempotent) with retries to guarantee handlers
      function bindPerElementHandlers() {
        try {
          const wedges = Array.from(document.querySelectorAll('#compass path[data-mode]'));
          wedges.forEach(w => {
            // ensure path receives pointer events
            w.style.pointerEvents = 'auto';
            if (!w.__v109bound) {
              // pointerenter/leave to show bloom and pause rotation
              w.addEventListener('pointerenter', () => {
                setInteractionPause(true);
                const angle = Number(w.getAttribute('data-angle') || 0);
                const ng = getNeedleGroup();
                if (ng) {
                  ng.classList.remove('idle');
                  try { ng.style.transform = `rotate(${angle}deg)`; } catch(e){}
                }
                try { w.classList.add('bloom'); } catch(e){}
              });
              w.addEventListener('pointerleave', () => {
                try { w.classList.remove('bloom'); } catch(e){}
                setInteractionPause(false);
              });
              // protect click double-binding; click will also be handled by delegation
              w.__v109bound = true;
            }
          });

          const buttons = Array.from(document.querySelectorAll('button[data-mode]'));
          buttons.forEach(b => {
            b.style.pointerEvents = 'auto';
            if (!b.__v109bound) {
              b.addEventListener('click', (ev) => {
                try { ev.preventDefault(); } catch(e){}
                const m = b.dataset.mode;
                console.debug('[v109] button click ->', m);
                navigateMode(m);
              });
              b.__v109bound = true;
            }
          });

          return { wedges: wedges.length, buttons: buttons.length };
        } catch(e) {
          console.warn('[v109] bindPerElementHandlers failed', e);
          return { error: String(e) };
        }
      }

      // Run binding attempts: immediate + short retries
      const bindResult1 = bindPerElementHandlers();
      setTimeout(bindPerElementHandlers, 200);
      setTimeout(bindPerElementHandlers, 1200);

      // Start the app views
      if (!location.hash) location.hash = '#home';
      try { renderRoute(); } catch(e) { console.warn('[v109] renderRoute error', e); }
      try { updateStreak(); } catch(e){ console.warn('[v109] updateStreak error', e); }

      // mark init log and expose for diagnostics
      window.__appInitLogged = true;
      console.info('[v109] App initialized; binding result:', bindResult1);

      // Expose a small helper to inspect current needle state
      window.__needleState = function(){
        const ng = getNeedleGroup();
        return ng ? { transform: ng.style.transform, classes: Array.from(ng.classList) } : null;
      };

      // Clean up when unloading
      window.addEventListener('beforeunload', () => { clearInterval(fallbackInterval); });
    } catch(err) {
      console.error('[v109] initialization failed', err);
      try { window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() }; } catch(e){}
      const root = document.getElementById('app-root') || document.body;
      if (root) { root.classList.add('visible'); root.setAttribute('aria-hidden','false'); }
    }
  }); // DOMContentLoaded
})();```

What to do next
- Replace your current app.js with the v109 content above (save then deploy if you host).
- Hard-refresh the page (or open a Private/Incognito tab) to ensure no cached JS.
- Open DevTools Console and verify these:
  - console.info shows "[v109] App initialized; binding result: ..."
  - console.debug logs when you click a wedge or button (e.g. "[v109] delegated wedge click -> grounded").
  - window.__needleState() returns a transform and class list when you scroll.

If after pasting you still cannot click wedges or buttons:
- Paste the output of the diagnostic block at the top of this message (the DIAG snippet).
- Paste any console errors (or the value of window.__lastAppError).

I’ll iterate immediately based on the diagnostic output.