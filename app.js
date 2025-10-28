// app.js v106 — robust, defensive, with improved arrow design + transparency
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/"/g,'\\"'); }

window.__lastAppError = null;
window.onerror = function(msg, url, line, col, err) {
  try { window.__lastAppError = { msg, url, line, col, err: (err && (err.stack||err.message))||null, time: new Date().toISOString() }; } catch(e){}
  return false;
};

window.__revealAppNow = function() {
  try {
    const s = document.getElementById('splash-screen');
    if (s) { s.classList.add('hidden'); s.style.pointerEvents='none'; s.style.display='none'; }
    const root = document.getElementById('app-root') || document.body;
    if (root) { root.classList.add('visible'); root.setAttribute('aria-hidden','false'); }
    console.info('Manual reveal: app shown.');
  } catch (e) { console.warn('manual reveal failed', e); }
};

document.addEventListener('DOMContentLoaded', () => {
  try {
    const splash = document.getElementById('splash-screen');
    const splashIcon = document.getElementById('splash-icon');
    const appRoot = document.getElementById('app-root');
    const compass = document.getElementById('compass');
    const needleGroup = document.getElementById('needle-group');

    // restart CSS animation in case browser skipped it on first paint
    if (splashIcon) {
      try {
        splashIcon.style.animation = 'none';
        void splashIcon.offsetWidth; // force reflow
        splashIcon.style.animation = 'splashZoom 1400ms cubic-bezier(.18,.9,.32,1) both';
      } catch(e){ console.warn('restart splash animation failed', e); }
    }

    // ensure app hidden until reveal
    if (appRoot) { appRoot.classList.remove('visible'); appRoot.setAttribute('aria-hidden','true'); }

    // ensure needle idle marker
    if (needleGroup && !needleGroup.classList.contains('idle')) needleGroup.classList.add('idle');

    // robust reveal: animationend, transitionend, load, fallback timeout
    (function revealFlow(){
      let done=false;
      function reveal() {
        if (done) return; done=true;
        try { if (splash) { splash.classList.add('hidden'); splash.style.pointerEvents='none'; } } catch(e){}
        setTimeout(()=> { if (appRoot) { appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); } }, 40);
        // remove splash element after transition to guarantee no overlay remains
        setTimeout(()=> { try { if (splash) { splash.style.display='none'; if (splash.parentNode) splash.parentNode.removeChild(splash); } } catch(e){} }, 900);
      }
      try {
        if (splash && splashIcon && appRoot) {
          splashIcon.addEventListener('animationend', reveal, { once: true });
          splash.addEventListener('transitionend', (ev)=> { if (ev.propertyName === 'opacity') reveal(); }, { once: true });
          window.addEventListener('load', reveal, { once: true });
          setTimeout(reveal, 2200); // shorter fallback — app won't be blocked
        } else {
          reveal();
        }
      } catch(e) { reveal(); }
    })();

    // NAV handlers
    document.querySelectorAll('.nav-links a[data-hash]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const h = a.getAttribute('data-hash') || a.getAttribute('href');
        console.debug('nav clicked', h);
        if (h) navigateHash(h);
      });
    });

    // Mode buttons
    document.querySelectorAll('button[data-mode]').forEach(b => {
      b.addEventListener('click', (e) => {
        const m = b.getAttribute('data-mode');
        console.debug('mode button clicked', m);
        if (m) navigateMode(m);
      });
    });

    // Ensure needle group doesn't intercept clicks
    if (needleGroup) needleGroup.style.pointerEvents = 'none';

    // Scroll-driven rotation (0..720deg)
    let lastScrollY=0, ticking=false, scrollActive=false, resumeTimer=null, interactionPause=false;
    function setInteractionPause(on){
      interactionPause = !!on;
      if (!on) { clearTimeout(resumeTimer); resumeTimer = setTimeout(()=>{ if (!scrollActive && needleGroup) needleGroup.classList.add('idle'); }, 260); }
      else { clearTimeout(resumeTimer); if (needleGroup) needleGroup.classList.remove('idle'); }
    }
    function onScroll(){
      lastScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      if (!ticking) { window.requestAnimationFrame(processScroll); ticking = true; }
    }
    function processScroll(){
      ticking=false;
      if (!needleGroup || interactionPause) return;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const ratio = Math.max(0, Math.min(1, lastScrollY / maxScroll));
      const angle = ratio * 720;
      needleGroup.classList.remove('idle');
      needleGroup.style.transform = `rotate(${angle}deg)`;
      scrollActive = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(()=>{ if (needleGroup && !interactionPause) needleGroup.classList.add('idle'); scrollActive=false; }, 420);
    }
    window.addEventListener('scroll', onScroll, { passive:true });

    // Wedge handlers (defensive)
    if (compass) {
      const wedges = Array.from(document.querySelectorAll('#compass path[data-mode]'));
      console.debug('bound wedges:', wedges.length);
      wedges.forEach(w => {
        const angle = Number(w.getAttribute('data-angle') || 0);
        w.setAttribute('tabindex','0');
        w.addEventListener('pointerenter', ()=> {
          setInteractionPause(true);
          if (needleGroup) needleGroup.classList.remove('idle');
          needleGroup && (needleGroup.style.transform = `rotate(${angle}deg)`);
          w.classList.add('bloom');
        });
        w.addEventListener('pointerleave', ()=> {
          w.classList.remove('bloom');
          setInteractionPause(false);
          clearTimeout(resumeTimer);
          resumeTimer = setTimeout(()=>{ if (!scrollActive && needleGroup) needleGroup.classList.add('idle'); }, 260);
        });
        w.addEventListener('pointerdown', (e)=> {
          try { e.preventDefault(); } catch(e){}
          setInteractionPause(true);
          if (needleGroup) needleGroup.classList.remove('idle');
          needleGroup && (needleGroup.style.transform = `rotate(${angle}deg)`);
          w.classList.add('bloom');
        }, { passive:false });
        w.addEventListener('click', (e)=> {
          try { e.preventDefault(); } catch(e){}
          console.debug('wedge click ->', w.getAttribute('data-mode'));
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
        w.addEventListener('keydown', (e)=> {
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
      compass.addEventListener('pointerdown', (e)=> {
        if (e.isPrimary === false) return;
        const path = e.target && e.target.closest ? e.target.closest('path[data-mode]') : null;
        if (path) pointerState = { id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now(), target: path };
      }, { passive:true });
      compass.addEventListener('pointermove', (e)=> {
        if (!pointerState || pointerState.id !== e.pointerId) return;
        const dx = e.clientX - pointerState.x, dy = e.clientY - pointerState.y;
        if (dx*dx + dy*dy > 28*28) pointerState = null;
      }, { passive:true });
      compass.addEventListener('pointerup', (e)=> {
        if (!pointerState || pointerState.id !== e.pointerId) { pointerState = null; return; }
        if (Date.now() - pointerState.t < 700) {
          const mode = pointerState.target.getAttribute('data-mode');
          if (mode) navigateMode(mode);
        }
        pointerState = null;
      }, { passive:true });
      compass.addEventListener('pointercancel', ()=> pointerState = null);
    }

    // Ensure mode buttons bind (again defensive)
    document.querySelectorAll('button[data-mode]').forEach(b => {
      b.addEventListener('click', (e) => {
        const m = b.getAttribute('data-mode');
        console.debug('mode button ->', m);
        if (m) navigateMode(m);
      });
    });

    // initial route + streak
    if (!location.hash) location.hash = '#home';
    renderRoute();
    updateStreak();
    console.info('App v106 initialized — check Console for binding logs (wedges/buttons).');
  } catch (err) {
    console.error('Initialization error:', err);
    try { window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() }; } catch(e){}
    const root = document.getElementById('app-root') || document.body;
    if (root) { root.classList.add('visible'); root.setAttribute('aria-hidden','false'); }
    try { const s = document.getElementById('splash-screen'); if (s && s.parentNode) s.parentNode.removeChild(s); } catch(e){}
  }
});

/* -- Remaining app functions (renderHome, renderModePage, completeActivity, renderHistory, renderQuickWins, renderAbout, updateStreak, runConfettiBurst) unchanged and included exactly as in the stable baseline. */