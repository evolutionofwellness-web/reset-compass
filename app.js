// app.js v28 (fix: robust splash -> app crossfade fallback + error handling)
// - Ensures app-root is revealed even if animationend never fires or a JS error occurs
// - Wraps splash/show logic in try/catch and logs errors to console
// - Keeps bloom + needle behavior and history/donut behavior unchanged

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/\"/g,'\\"') }

document.addEventListener("DOMContentLoaded", () => {
  // Defensive wrapper: if anything throws below, we catch and still reveal the app.
  try {
    const splash = document.getElementById("splash-screen");
    const splashIcon = document.getElementById("splash-icon");
    const appRoot = document.getElementById("app-root");
    const needleGroup = document.getElementById("needle-group");

    // Make sure app-root is in the expected initial state
    if (appRoot && !appRoot.classList.contains('visible')) {
      appRoot.classList.remove('visible');
      appRoot.setAttribute('aria-hidden','true');
    }

    // Ensure needle-group exists and set neutral rotation (no idle sway)
    if (needleGroup && !needleGroup.style.transform) needleGroup.style.transform = 'rotate(0deg)';

    // Splash: after the icon animation completes, fade out the overlay AND fade app in for crossfade.
    // Wrapped in try/catch to avoid blocking the show behavior if any DOM access issues happen.
    if (splashIcon && splash && appRoot) {
      try {
        splashIcon.addEventListener("animationend", () => {
          // fade out splash
          splash.classList.add('hidden');
          // fade in app
          requestAnimationFrame(() => {
            appRoot.classList.add('visible');
            appRoot.setAttribute('aria-hidden','false');
          });
          // remove splash from DOM after fade completes
          setTimeout(() => { if (splash && splash.parentNode) splash.parentNode.removeChild(splash); }, 520);
        }, { once: true });
      } catch (err) {
        console.error('Error attaching animationend listener on splashIcon:', err);
        // Fall through to fallback below
      }

      // fallback in case animation doesn't run or animationend never fires:
      // after 2800ms ensure app is visible and remove the splash.
      setTimeout(() => {
        try {
          if (splash && splash.parentNode) {
            splash.classList.add('hidden');
            if (appRoot) {
              appRoot.classList.add('visible');
              appRoot.setAttribute('aria-hidden','false');
            }
            // remove splash after fade
            setTimeout(()=>{ if (splash && splash.parentNode) splash.parentNode.removeChild(splash); },520);
          }
        } catch (err) {
          console.error('Fallback splash removal error:', err);
          // Ensure app is visible even if DOM removal failed
          if (appRoot) { appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); }
        }
      }, 2800);
    } else {
      // If any of the elements are missing, reveal app immediately so users are not left staring at a blank screen.
      if (appRoot) { appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); }
      if (splash && splash.parentNode) {
        try { splash.parentNode.removeChild(splash); } catch(e){ /* ignore */ }
      }
    }

    // --- Rest of initialization below (unchanged behavior) ---

    // first-run start at home
    if (!sessionStorage.getItem('appStarted')) {
      sessionStorage.setItem('appStarted','true');
      history.replaceState(null,'','#home');
    } else {
      if (!location.hash) location.hash = '#home';
    }

    // nav wiring
    document.querySelectorAll(".nav-links a[data-hash]").forEach(a => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const h = a.getAttribute("data-hash") || a.getAttribute("href");
        if (h) navigateHash(h);
      });
    });

    // mode buttons delegation
    document.getElementById("mode-buttons")?.addEventListener("click", (e) => {
      const btn = e.target.closest && e.target.closest('button[data-mode]');
      if (btn) {
        const mode = btn.getAttribute('data-mode');
        if (mode) navigateMode(mode);
      }
    });

    // Compass interactions: rotate needle to wedge on hover/focus/tap, bloom on hover & stronger bloom on select
    const compass = document.getElementById("compass");
    function findPathElement(el){ return el && el.closest ? el.closest('path[data-mode]') : null; }

    if (compass && needleGroup) {
      const wedges = Array.from(document.querySelectorAll('#compass path[data-mode]'));
      wedges.forEach(w => {
        const angle = Number(w.getAttribute('data-angle') || 0);

        // pointerenter -> bloom (light) and rotate needle
        w.addEventListener('pointerenter', () => {
          w.classList.remove('bloom-strong');
          w.classList.add('bloom');
          setNeedleRotation(angle);
        });

        // pointerleave -> remove bloom and return needle to neutral
        w.addEventListener('pointerleave', () => {
          w.classList.remove('bloom');
          setTimeout(()=> setNeedleRotation(0), 200);
        });

        // pointerdown: immediate feedback on touch
        w.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          w.classList.remove('bloom-strong');
          w.classList.add('bloom');
          setNeedleRotation(angle);
        }, {passive:false});

        // click: strong bloom + spin animation, then navigate
        w.addEventListener('click', (e) => {
          e.preventDefault();
          w.classList.remove('bloom');
          w.classList.add('bloom-strong');
          runNeedleSpin().then(() => {
            w.classList.remove('bloom-strong');
            const mode = w.getAttribute('data-mode');
            if (mode) navigateMode(mode);
          });
        });

        // keyboard activation
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

    // Helper: set rotation (JS relies on CSS transition)
    function setNeedleRotation(angle){
      if (!needleGroup) return;
      needleGroup.style.transform = `rotate(${angle}deg)`;
    }

    // Helper: run brief spin animation class and resolve when finished
    function runNeedleSpin(){
      return new Promise((resolve) => {
        if (!needleGroup) return resolve();
        needleGroup.classList.add('needle-spin');
        setTimeout(() => {
          needleGroup.classList.remove('needle-spin');
          setNeedleRotation(0);
          resolve();
        }, 560);
      });
    }

    // pointer heuristics for wedge tapping (avoid accidental activations)
    if (compass) {
      let pointerState = null;
      compass.addEventListener("pointerdown", (e) => {
        if (e.isPrimary === false) return;
        const path = findPathElement(e.target);
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

    // ensure path elements are keyboard focusable
    document.querySelectorAll("#compass path[data-mode]").forEach(p => p.setAttribute("tabindex","0"));

    window.addEventListener("hashchange", renderRoute);
    if (!location.hash) location.hash = "#home";
    renderRoute();
    updateStreak();

  } catch (err) {
    // In case of any unexpected runtime error, reveal the app to avoid the blank screen
    console.error('Uncaught initialization error:', err);
    const appRootFail = document.getElementById("app-root");
    if (appRootFail) { appRootFail.classList.add('visible'); appRootFail.setAttribute('aria-hidden','false'); }
    const splashFail = document.getElementById("splash-screen");
    if (splashFail && splashFail.parentNode) {
      try { splashFail.parentNode.removeChild(splashFail); } catch(e){ /* ignore */ }
    }
  }
});

/* The rest of the app (activities, render functions, completeActivity, history donut, confetti, etc.)
   is unchanged from previous v27 implementation. Keep those functions here unchanged. */

const activities = {
  growing: [
    { label: "Write a goal", icon: "🎯" },
    { label: "Tackle a challenge", icon: "⚒️" },
    { label: "Start a new project", icon: "🚀" }
  ],
  grounded: [
    { label: "Declutter a space", icon: "🧹" },
    { label: "Complete a task", icon: "✅" },
    { label: "Plan your day", icon: "🗓️" }
  ],
  drifting: [
    { label: "Go for a walk", icon: "🚶" },
    { label: "Journal your thoughts", icon: "✍️" },
    { label: "Listen to calming music", icon: "🎧" }
  ],
  surviving: [
    { label: "Drink water", icon: "💧" },
    { label: "Breathe deeply", icon: "🌬️" },
    { label: "Rest for 5 minutes", icon: "😴" }
  ]
};

function navigateHash(hash){ location.hash = hash; }
function navigateMode(mode){ location.hash = `#mode/${mode}`; }

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
  } else if (h === "#history") {
    renderHistory();
  } else if (h === "#about") {
    renderAbout();
  } else {
    renderHome();
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderHome(){
  const c = document.getElementById("content");
  if (!c) return;
  c.innerHTML = "";
  const compassContainer = document.getElementById("compass-container");
  const modeButtons = document.getElementById("mode-buttons");
  const howTo = document.getElementById("how-to");
  if (compassContainer) compassContainer.style.display = "";
  if (modeButtons) modeButtons.style.display = "";
  if (howTo) howTo.style.display = "";
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderModePage(mode){
  const c = document.getElementById("content");
  if (!c) return;
  if (!activities[mode]) { c.innerHTML = `<p>Unknown mode</p>`; return; }

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

function completeActivity(mode, activity, noteId, rowId){
  const row = document.getElementById(rowId);
  if (row) {
    row.classList.add('activity-complete-pop');
    setTimeout(()=>row.classList.remove('activity-complete-pop'),700);
  }

  const note = noteId ? (document.getElementById(noteId)?.value || "") : "";
  const date = new Date().toLocaleDateString();
  const normalizedMode = (mode === 'quick' || mode === 'quick-win') ? 'quick-win' : mode;
  const entry = { date, mode: normalizedMode, activity, note };
  let history = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  history.unshift(entry);
  localStorage.setItem("resetHistory", JSON.stringify(history));

  const lastLogged = localStorage.getItem("lastLogged");
  const today = new Date().toLocaleDateString();
  if (lastLogged !== today){
    let streak = parseInt(localStorage.getItem("streak")||"0",10) || 0;
    streak += 1;
    localStorage.setItem("streak", String(streak));
    localStorage.setItem("lastLogged", today);
    const streakEmoji = document.getElementById("streak-emoji");
    if (streakEmoji) { streakEmoji.classList.add('streak-pop'); setTimeout(()=>streakEmoji.classList.remove('streak-pop'), 1100); }
    updateStreak();
    runConfettiBurst();
  } else {
    runConfettiBurst();
  }

  const activeWedge = document.querySelector(`#compass path[data-mode="${normalizedMode}"]`);
  if (activeWedge) {
    activeWedge.classList.add('bloom-strong');
    const ng = document.getElementById('needle-group');
    if (ng) {
      ng.classList.add('needle-spin');
      setTimeout(()=>{ ng.classList.remove('needle-spin'); activeWedge.classList.remove('bloom-strong'); navigateHash('#history'); }, 620);
    } else {
      setTimeout(()=>{ activeWedge.classList.remove('bloom-strong'); navigateHash('#history'); }, 600);
    }
  } else {
    setTimeout(()=>{ navigateHash('#history'); }, 700);
  }
}

function runConfettiBurst(){
  try {
    const n = 16;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '50%';
    container.style.top = '32%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = 99999;
    container.style.transform = 'translateX(-50%)';
    document.body.appendChild(container);

    for (let i=0;i<n;i++){
      const dot = document.createElement('div');
      dot.style.width = (8 + Math.round(Math.random()*8)) + 'px';
      dot.style.height = dot.style.width;
      dot.style.borderRadius = '50%';
      dot.style.background = ['#FFD166','#06D6A0','#118AB2','#EF476F'][i%4];
      dot.style.position = 'absolute';
      dot.style.left = '0';
      dot.style.top = '0';
      dot.style.opacity = '0.95';
      container.appendChild(dot);
      const angle = (Math.random()*Math.PI*2);
      const dist = 60 + Math.random()*100;
      const dx = Math.cos(angle)*dist;
      const dy = Math.sin(angle)*dist;
      dot.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.9)`, opacity: 0.9 }
      ], { duration: 700 + Math.random()*300, easing: 'cubic-bezier(.2,.9,.2,1)'});
    }
    setTimeout(()=>container.remove(), 1400);
  } catch(e){}
}

function updateStreak(){ const el = document.getElementById("streak-count"); if (el) el.textContent = localStorage.getItem("streak") || "0" }

function renderQuickWins(){
  const c = document.getElementById("content");
  if (!c) return;
  const quick = [
    { label: "Drink water", icon: "💧" },
    { label: "Stand up and stretch", icon: "🧘" },
    { label: "Take 3 deep breaths", icon: "🌬️" }
  ];
  c.innerHTML = `<div class="mode-page"><h2>Quick Wins</h2>` + quick.map((q,i) =>
    `<div class="activity-row" id="row-quick-${i}">
       <div class="activity-main"><span class="activity-icon">${escapeHtml(q.icon)}</span><div class="activity-label">${escapeHtml(q.label)}</div></div>
       <textarea id="qw-${i}" class="activity-note" placeholder="Notes (optional)"></textarea>
       <div class="activity-controls"><button class="btn btn-complete" onclick="completeActivity('quick-win','${escapeJs(q.label)}','qw-${i}','row-quick-${i}')">Complete</button></div>
     </div>`
  ).join('') + `<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;

  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderHistory(){
  const c = document.getElementById("content");
  if (!c) return;
  const history = JSON.parse(localStorage.getItem("resetHistory") || "[]");

  const counts = { 'growing':0, 'grounded':0, 'drifting':0, 'surviving':0, 'quick-win':0 };
  history.forEach(h => {
    const key = (h.mode||'').toLowerCase();
    if (counts[key] != null) counts[key] += 1;
  });
  const total = counts['growing'] + counts['grounded'] + counts['drifting'] + counts['surviving'] + counts['quick-win'];

  let statsHtml = '';
  if (total === 0) {
    statsHtml = `<p>No entries yet. Complete an activity to build your stats.</p>`;
  } else {
    statsHtml = `<div class="history-stats"><div class="history-chart-wrap"><canvas id="history-donut" aria-label="Mode distribution" role="img"></canvas></div></div>`;
  }

  const displayLabel = (m) => {
    if (!m) return '';
    const key = m.toLowerCase();
    if (key === 'quick-win' || key === 'quick') return 'Quick Win';
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  let listHtml = '';
  if (history.length === 0) {
    listHtml = '<p>No history yet.</p>';
  } else {
    listHtml = history.map(h => `<p><strong>${escapeHtml(h.date)}:</strong> ${escapeHtml(displayLabel(h.mode))} — ${escapeHtml(h.activity)}${h.note ? ' • <em>'+escapeHtml(h.note)+'</em>' : ''}</p>`).join('');
  }

  c.innerHTML = `<div class="mode-page"><h2>History</h2>${statsHtml}<div>${listHtml}</div><button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;

  if (total > 0 && typeof Chart !== 'undefined') {
    const ctx = document.getElementById('history-donut').getContext('2d');
    const labels = ['Growing','Grounded','Drifting','Surviving','Quick Win'];
    const data = [
      counts['growing']||0,
      counts['grounded']||0,
      counts['drifting']||0,
      counts['surviving']||0,
      counts['quick-win']||0
    ];
    const bg = ['#007BFF','#246B45','#DAA520','#D9534F','#6c757d'];
    if (window.__historyChart) try { window.__historyChart.destroy(); } catch(e){}
    window.__historyChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: bg, hoverOffset: 10, borderWidth: 0 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: function(context){
                const val = context.dataset.data[context.dataIndex] || 0;
                const pct = total ? Math.round((val / total) * 100) : 0;
                return `${context.label}: ${val} (${pct}%)`;
              }
            }
          }
        },
        animation: { animateScale: true, duration: 650 }
      }
    });
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderAbout(){
  const c = document.getElementById("content");
  if (!c) return;
  c.innerHTML = `<div class="mode-page"><h2>About</h2>
    <p>The Reset Compass was created by Marcus Clark to help you align energy and action with your state. Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p>
    <button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;
}

function capitalize(s){ return (s||'').charAt(0).toUpperCase()+ (s||'').slice(1) }

/* ensure fadeRow keyframe exists */
(function(){
  try {
    const style = document.createElement('style');
    style.textContent = `@keyframes fadeRow{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`;
    document.head.appendChild(style);
  } catch(e){}
})();