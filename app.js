// app.js v104 — fixes: restart splash animation reliably, needle non-interactive (no click blocking),
// full defensive binding with logs so we can confirm handlers are attached, diamond-style arrow

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/"/g,'\\"'); }

window.__lastAppError = null;
window.onerror = function(msg,url,line,col,err){ try{ window.__lastAppError={msg,url,line,col,err:(err&&(err.stack||err.message))||null,time:new Date().toISOString()}; }catch(e){}; return false; };

document.addEventListener('DOMContentLoaded', () => {
  try {
    const splash = document.getElementById('splash-screen');
    const splashIcon = document.getElementById('splash-icon');
    const appRoot = document.getElementById('app-root');
    const needleGroup = document.getElementById('needle-group');
    const compass = document.getElementById('compass');

    // make sure the animation will actually run: restart animation programmatically
    if (splashIcon) {
      try {
        splashIcon.style.animation = 'none';
        // force reflow, then reapply the animation so it reliably plays on all browsers
        // (addresses cases where the animation may have been skipped)
        // eslint-disable-next-line no-unused-expressions
        splashIcon.offsetHeight;
        splashIcon.style.animation = '';
        // ensure the CSS animation name is present (will fall back to CSS if needed)
        splashIcon.style.animation = 'splashZoom 1400ms cubic-bezier(.18,.9,.32,1) both';
      } catch (e) { console.warn('could not restart splash animation', e); }
    }

    // ensure app root hidden until reveal
    if (appRoot) { appRoot.classList.remove('visible'); appRoot.setAttribute('aria-hidden','true'); }

    // ensure idle indicator
    if (needleGroup && !needleGroup.classList.contains('idle')) needleGroup.classList.add('idle');

    // Robust splash reveal (multiple signals)
    (() => {
      let revealed = false;
      function doReveal() {
        if (revealed) return; revealed = true;
        try { if (splash) { splash.classList.add('hidden'); splash.style.pointerEvents = 'none'; } } catch(e){}
        setTimeout(()=> { if (appRoot) { appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); } }, 40);
        setTimeout(()=> { try { if (splash && splash.parentNode) splash.parentNode.removeChild(splash); } catch(e) {} }, 900);
      }
      try {
        if (splashIcon && splash && appRoot) {
          splashIcon.addEventListener('animationend', doReveal, { once: true });
          splash.addEventListener('transitionend', (ev) => { if (ev.propertyName === 'opacity') doReveal(); }, { once: true });
          window.addEventListener('load', doReveal, { once: true });
          setTimeout(doReveal, 3000);
        } else {
          doReveal();
        }
      } catch(e) {
        doReveal();
      }
    })();

    // Attach nav handlers (defensive + logs)
    document.querySelectorAll('.nav-links a[data-hash]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const h = a.getAttribute('data-hash') || a.getAttribute('href');
        console.debug('nav clicked ->', h);
        if (h) navigateHash(h);
      });
    });

    // Mode buttons
    document.querySelectorAll('button[data-mode]').forEach(b => {
      b.addEventListener('click', (e) => {
        const m = b.getAttribute('data-mode');
        console.debug('mode button clicked ->', m);
        if (m) navigateMode(m);
      });
    });

    // Ensure needle doesn't swallow pointer events (so wedges/buttons are clickable)
    if (needleGroup) needleGroup.style.pointerEvents = 'none';

    // Scroll-driven rotation (0..720 degrees) — same efficient RAF-driven implementation
    let lastScrollY = 0, ticking = false, scrollActive = false, resumeTimer = null, interactionPause = false;
    function setInteractionPause(on) {
      interactionPause = !!on;
      if (!on) { clearTimeout(resumeTimer); resumeTimer = setTimeout(()=>{ if (!scrollActive && needleGroup) needleGroup.classList.add('idle'); }, 260); }
      else { clearTimeout(resumeTimer); if (needleGroup) needleGroup.classList.remove('idle'); }
    }
    function onScroll() {
      lastScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      if (!ticking) { window.requestAnimationFrame(processScroll); ticking = true; }
    }
    function processScroll() {
      ticking = false;
      if (!needleGroup || interactionPause) return;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const ratio = Math.max(0, Math.min(1, lastScrollY / maxScroll));
      const angle = ratio * 720;
      needleGroup.classList.remove('idle');
      needleGroup.style.transform = `rotate(${angle}deg)`;
      scrollActive = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(()=>{ if (needleGroup && !interactionPause) needleGroup.classList.add('idle'); scrollActive = false; }, 420);
    }
    window.addEventListener('scroll', onScroll, { passive:true });

    // Wedges interactions / bindings (with logs)
    if (compass) {
      const wedges = Array.from(document.querySelectorAll('#compass path[data-mode]'));
      console.debug('Found wedges:', wedges.length);
      wedges.forEach(w => {
        const angle = Number(w.getAttribute('data-angle') || 0);
        w.setAttribute('tabindex','0');
        w.addEventListener('pointerenter', () => {
          setInteractionPause(true);
          if (needleGroup) needleGroup.classList.remove('idle');
          needleGroup && (needleGroup.style.transform = `rotate(${angle}deg)`);
          w.classList.add('bloom');
        });
        w.addEventListener('pointerleave', () => {
          w.classList.remove('bloom');
          setInteractionPause(false);
          clearTimeout(resumeTimer);
          resumeTimer = setTimeout(()=>{ if(!scrollActive && needleGroup) needleGroup.classList.add('idle'); }, 260);
        });
        w.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          setInteractionPause(true);
          if (needleGroup) needleGroup.classList.remove('idle');
          needleGroup && (needleGroup.style.transform = `rotate(${angle}deg)`);
          w.classList.add('bloom');
        }, {passive:false});
        w.addEventListener('click', (e) => {
          e.preventDefault();
          console.debug('wedge clicked:', w.getAttribute('data-mode'));
          w.classList.remove('bloom'); w.classList.add('bloom-strong');
          if (needleGroup) {
            needleGroup.classList.remove('idle');
            needleGroup.classList.add('needle-spin');
            setTimeout(()=> {
              needleGroup.classList.remove('needle-spin');
              needleGroup.classList.add('idle');
              w.classList.remove('bloom-strong');
              const mode = w.getAttribute('data-mode');
              if (mode) navigateMode(mode);
              setInteractionPause(false);
            }, 560);
          } else {
            const mode = w.getAttribute('data-mode');
            if (mode) navigateMode(mode);
            setInteractionPause(false);
          }
        });
        w.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const m = w.getAttribute('data-mode');
            if (m) navigateMode(m);
          }
        });
      });
    }

    // pointer heuristics (tap safety)
    if (compass) {
      let pointerState = null;
      compass.addEventListener('pointerdown', (e) => { if (e.isPrimary === false) return; const path = e.target && e.target.closest ? e.target.closest('path[data-mode]') : null; if (path) pointerState = { id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now(), target: path }; }, {passive:true});
      compass.addEventListener('pointermove', (e) => { if (!pointerState || pointerState.id !== e.pointerId) return; const dx = e.clientX - pointerState.x, dy = e.clientY - pointerState.y; if (dx*dx + dy*dy > 28*28) pointerState = null; }, {passive:true});
      compass.addEventListener('pointerup', (e) => { if (!pointerState || pointerState.id !== e.pointerId) { pointerState = null; return; } if (Date.now() - pointerState.t < 700) { const mode = pointerState.target.getAttribute('data-mode'); if (mode) navigateMode(mode); } pointerState = null; }, {passive:true});
      compass.addEventListener('pointercancel', () => pointerState = null);
    }

    // ensure big mode buttons are clickable (defensive)
    document.querySelectorAll('button[data-mode]').forEach(b => {
      b.addEventListener('click', () => { console.debug('button handler triggered for', b.getAttribute('data-mode')); });
    });

    // routing + initial render
    if (!location.hash) location.hash = '#home';
    renderRoute();
    updateStreak();
    console.info('App v104 initialized. If clicks still fail, open Console and paste window.__lastAppError');
  } catch (err) {
    console.error('Initialization error:', err);
    window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() };
    const appRoot = document.getElementById('app-root') || document.body;
    if (appRoot) { appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); }
    try { const splash = document.getElementById('splash-screen'); if (splash && splash.parentNode) splash.parentNode.removeChild(splash); } catch(e){}
  }
});

/* --- activities, render functions, completeActivity, history etc. (unchanged baseline) --- */
/* Keep the same, tested implementations from the earlier stable baseline (v25) so behavior is consistent. */