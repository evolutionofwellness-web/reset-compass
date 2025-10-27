// app.js v29 (center rose + themes)
// - Decorative central compass-rose with idle motion and stronger spin/pulse on select
// - Page-level themes applied on renderModePage (body.theme-<mode>)
// - Wedge bloom/select behavior unchanged, but coordinated with central-rose animation

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
  const centralRose = document.getElementById("central-rose");

  // ensure idle class present (subtle spin)
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

  // Helper: set needle+rose rotation
  function setNeedleRotation(angle){
    if (!needleGroup) return;
    needleGroup.style.transform = `rotate(${angle}deg)`;
  }

  // Helper: theme toggle
  function applyTheme(mode) {
    document.body.classList.remove('theme-growing','theme-grounded','theme-drifting','theme-surviving');
    if (!mode) return;
    const map = {
      growing: 'theme-growing',
      grounded: 'theme-grounded',
      drifting: 'theme-drifting',
      surviving: 'theme-surviving'
    };
    const cls = map[mode];
    if (cls) document.body.classList.add(cls);
  }

  // Stronger interaction spin/pulse
  function runRoseSpinAndNavigate(wedge, mode){
    // pause idle and apply active styling
    if (needleGroup) {
      needleGroup.classList.remove('idle');
      needleGroup.classList.add('active','needle-spin');
    }
    if (wedge) { wedge.classList.remove('bloom'); wedge.classList.add('bloom-strong'); }

    setTimeout(()=> {
      // cleanup
      if (needleGroup) {
        needleGroup.classList.remove('needle-spin','active');
        needleGroup.classList.add('idle');
        setNeedleRotation(0);
      }
      if (wedge) wedge.classList.remove('bloom-strong');
      // navigate to page (mode)
      if (mode) navigateMode(mode);
    }, 560);
  }

  // compass interactions
  const compass = document.getElementById("compass");
  if (compass && needleGroup) {
    const wedges = Array.from(document.querySelectorAll('#compass path[data-mode]'));
    wedges.forEach(w => {
      const angle = Number(w.getAttribute('data-angle') || 0);

      w.addEventListener('pointerenter', () => {
        // pause idle for clear pointing
        needleGroup.classList.remove('idle');
        setNeedleRotation(angle);
        w.classList.remove('bloom-strong');
        w.classList.add('bloom');
      });
      w.addEventListener('pointerleave', () => {
        w.classList.remove('bloom');
        setNeedleRotation(0);
        setTimeout(()=> needleGroup.classList.add('idle'), 260);
      });

      w.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        needleGroup.classList.remove('idle');
        setNeedleRotation(angle);
        w.classList.add('bloom');
      }, {passive:false});

      w.addEventListener('click', (e) => {
        e.preventDefault();
        const mode = w.getAttribute('data-mode');
        // perform rose spin/pulse then navigate
        runRoseSpinAndNavigate(w, mode);
      });

      w.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const mode = w.getAttribute('data-mode');
          if (w) runRoseSpinAndNavigate(w, mode);
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
    compass.addEventListener("pointerup", (e) => { pointerState = null; }, {passive:true});
    compass.addEventListener("pointercancel", () => pointerState = null);
  }

  // ensure wedges are keyboard focusable
  document.querySelectorAll("#compass path[data-mode]").forEach(p => { p.setAttribute("tabindex","0"); });

  // routing + theme application on mode pages
  window.addEventListener("hashchange", renderRoute);
  if (!location.hash) location.hash = "#home";
  renderRoute();
  updateStreak();

  // apply theme based on current route (call from renderRoute)
  // renderRoute will call applyTheme(...) via renderModePage below
});

/* The rest of the app (activities, renderModePage, completeActivity, renderHistory, etc.)
   should keep the previous v25 code, but ensure renderModePage invokes applyTheme(mode).
   Below are the renderModePage and helpers adjusted to apply theme. */

function navigateHash(hash) { location.hash = hash; }
function navigateMode(mode) { location.hash = `#mode/${mode}`; }

function renderRoute(){
  const h = location.hash || "#home";
  const isFullPage = h !== "#home";
  const compassContainer = document.getElementById("compass-container");
  const modeButtons = document.getElementById("mode-buttons");
  const howTo = document.getElementById("how-to");

  if (compassContainer) compassContainer.style.display = isFullPage ? "none" : "";
  if (modeButtons) modeButtons.style.display = isFullPage ? "none" : "";
  if (howTo) howTo.style.display = isFullPage ? "none" : "";

  if (h.startsWith("#mode/")) {
    const mode = h.split("/")[1];
    renderModePage(mode);
  } else if (h === "#quick") {
    renderQuickWins();
    applyTheme(null);
  } else if (h === "#history") {
    renderHistory();
    applyTheme(null);
  } else if (h === "#about") {
    renderAbout();
    applyTheme(null);
  } else {
    renderHome();
    applyTheme(null);
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderModePage(mode){
  const c = document.getElementById("content");
  if (!c) return;
  if (!activities[mode]) { c.innerHTML = `<p>Unknown mode</p>`; return; }

  // apply theme for this mode
  applyTheme(mode);

  c.innerHTML = `<div class="mode-page" role="region" aria-labelledby="mode-title">
      <h2 id="mode-title">${capitalize(mode)}</h2>
      ${activities[mode].map((act,i) =>
        `<div class="activity-row" id="row-${mode}-${i}" role="group" aria-label="${escapeHtml(act.label)}">
           <div class="activity-main">
             <span class="activity-icon" aria-hidden="true">${escapeHtml(act.icon)}</span>
             <div class="activity-label">${escapeHtml(act.label)}</div>
           </div>
           <textarea id="note-${mode}-${i}" class="activity-note" placeholder="Notes (optional)" aria-label="Notes for ${escapeHtml(act.label)}"></textarea>
           <div class="activity-controls">
             <button class="btn btn-complete" onclick="completeActivity('${mode}','${escapeJs(act.label)}','note-${mode}-${i}','row-${mode}-${i}')">Complete</button>
           </div>
         </div>`
      ).join("")}
      <button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button>
    </div>`;

  const container = c.querySelector('.mode-page');
  if (container && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.from(container.querySelectorAll('.activity-row')).forEach((row,i)=>{
      row.style.animation = `fadeRow 420ms ease ${i*40}ms both`;
    });
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/* The rest (completeActivity, renderQuickWins, renderHistory, renderAbout, runConfettiBurst, etc.)
   remain the same as v25. Ensure they exist in your app.js (unchanged) so the app functions. */