// app.js v29 (compass visual polish: slim needle, bloom/pop for wedges, hide harsh edge on selection)
// - Use classes for bloom/popup so we don't rely on stroke changes directly
// - Pause the idle needle animation while pointing to a wedge and resume afterwards
// - Spin + bloom on select, then navigate

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
  );
}
function escapeJs(s) {
  return String(s || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const splashIcon = document.getElementById("splash-icon");
  const needleGroup = document.getElementById("needle-group");

  // ensure idle class present (subtle spin) so compass feels alive
  if (needleGroup && !needleGroup.classList.contains('idle')) needleGroup.classList.add('idle');

  // Splash fade with fallback (keeps existing behavior)
  if (splashIcon && splash) {
    splashIcon.addEventListener("animationend", () => {
      splash.classList.add('hidden');
      setTimeout(() => { if (splash && splash.parentNode) splash.parentNode.removeChild(splash); }, 420);
    }, { once: true });

    setTimeout(() => {
      if (splash) {
        splash.classList.add('hidden');
        setTimeout(()=>{ if (splash && splash.parentNode) splash.parentNode.removeChild(splash); },420);
      }
    }, 2600);
  } else if (splash && splash.parentNode) {
    splash.parentNode.removeChild(splash);
  }

  // navigation wiring
  document.querySelectorAll(".nav-links a[data-hash]").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const h = a.getAttribute("data-hash") || a.getAttribute("href");
      if (h) navigateHash(h);
    });
  });

  document.getElementById("mode-buttons")?.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest('button[data-mode]');
    if (btn) {
      const mode = btn.getAttribute('data-mode');
      if (mode) navigateMode(mode);
    }
  });

  const compass = document.getElementById("compass");
  const needle = document.getElementById("compass-needle");

  function setNeedleRotation(angle){
    if (!needleGroup) return;
    needleGroup.style.transform = `rotate(${angle}deg)`;
  }

  function runNeedleSpin(){
    return new Promise((resolve) => {
      if (!needleGroup) return resolve();
      // pause idle animation and run spin class
      needleGroup.classList.remove('idle');
      needleGroup.classList.add('needle-spin');
      setTimeout(() => {
        needleGroup.classList.remove('needle-spin');
        setNeedleRotation(0);
        // resume idle after settle
        needleGroup.classList.add('idle');
        resolve();
      }, 560);
    });
  }

  if (compass && needleGroup) {
    const wedges = Array.from(document.querySelectorAll('#compass path[data-mode]'));
    wedges.forEach(w => {
      const angle = Number(w.getAttribute('data-angle') || 0);

      w.addEventListener('pointerenter', () => {
        // pause idle for clear pointing
        needleGroup.classList.remove('idle');
        setNeedleRotation(angle);
        // light bloom (class-driven)
        w.classList.remove('bloom-strong');
        w.classList.add('bloom');
      });
      w.addEventListener('pointerleave', () => {
        w.classList.remove('bloom');
        // return needle to neutral then resume idle after transition
        setNeedleRotation(0);
        setTimeout(()=> needleGroup.classList.add('idle'), 260);
      });

      w.addEventListener('pointerdown', (e) => {
        // immediate feedback on touch
        e.preventDefault();
        needleGroup.classList.remove('idle');
        setNeedleRotation(angle);
        w.classList.add('bloom');
      }, {passive:false});

      w.addEventListener('click', (e) => {
        e.preventDefault();
        // stronger bloom + spin then navigate
        w.classList.remove('bloom');
        w.classList.add('bloom-strong');
        // ensure idle paused and run spin
        needleGroup.classList.remove('idle');
        needleGroup.classList.add('needle-spin');
        setTimeout(()=> {
          needleGroup.classList.remove('needle-spin');
          setNeedleRotation(0);
          needleGroup.classList.add('idle');
          w.classList.remove('bloom-strong');
          const mode = w.getAttribute('data-mode');
          if (mode) navigateMode(mode);
        }, 560);
      });

      w.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          w.classList.add('bloom-strong');
          runNeedleSpin().then(()=> {
            w.classList.remove('bloom-strong');
            const mode = w.getAttribute('data-mode');
            if (mode) navigateMode(mode);
          });
        }
      });
    });
  }

  // pointer heuristics for tap activation (unchanged)
  if (compass) {
    let pointerState = null;
    compass.addEventListener("pointerdown", (e) => {
      if (e.isPrimary === false) return;
      const path = e.target && e.target.closest ? e.target.closest('path[data-mode]') : null;
      if (path) pointerState = { id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now(), target: path };
    }, {passive:true});
    compass.addEventListener("pointermove", (e) => {
      if (!pointerState || pointerState.id !== e.pointerId) return;
      const dx = e.clientX - pointerState.x, dy = e.clientY - pointerState.y;
      if (dx*dx + dy*dy > 28*28) pointerState = null;
    }, {passive:true});
    compass.addEventListener("pointerup", (e) => {
      pointerState = null;
    }, {passive:true});
    compass.addEventListener("pointercancel", () => pointerState = null);
  }

  // ensure wedges are keyboard focusable
  document.querySelectorAll("#compass path[data-mode]").forEach(p => {
    p.setAttribute("tabindex","0");
  });

  window.addEventListener("hashchange", renderRoute);
  if (!location.hash) location.hash = "#home";
  renderRoute();
  updateStreak();
});

/* Rest of the app (activities, render functions, completeActivity, history) remain unchanged.
   Keep the existing v25 implementations for those functions so behavior is as-before. */