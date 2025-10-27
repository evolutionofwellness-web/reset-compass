// app.js v25 (updated with donut chart + compass pops & needle)
// - Uses Chart.js for History donut visualization
// - Smooth splash overlay fade transition
// - Compass wedge hover causes needle to rotate and wedge to pop
// - Route navigation scrolls to top
// - Streak emoji pulses when incremented

function escapeHtml(s){
  return String(s||'').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[ch]));
}
function escapeJs(s){ return String(s||'').replace(/'/g,\"\\\\'\").replace(/\\\"/g,'\\\\\"') }

document.addEventListener(\"DOMContentLoaded\", () => {
  const splash = document.getElementById(\"splash-screen\");
  const splashIcon = document.getElementById(\"splash-icon\");

  // Splash: after the icon animation completes, fade out the overlay for a clean crossfade.
  if (splashIcon && splash) {
    splashIcon.addEventListener(\"animationend\", () => {
      splash.classList.add('hidden');
      setTimeout(() => { if (splash && splash.parentNode) splash.parentNode.removeChild(splash); }, 420);
    }, { once: true });

    // fallback
    setTimeout(() => {
      if (splash) {
        splash.classList.add('hidden');
        setTimeout(()=>{ if (splash && splash.parentNode) splash.parentNode.removeChild(splash); },420);
      }
    }, 2600);
  } else if (splash && splash.parentNode) {
    splash.parentNode.removeChild(splash);
  }

  // first-run start at home
  if (!sessionStorage.getItem('appStarted')) {
    sessionStorage.setItem('appStarted','true');
    history.replaceState(null,'','#home');
  } else {
    if (!location.hash) location.hash = '#home';
  }

  // nav wiring
  document.querySelectorAll(\".nav-links a[data-hash]\").forEach(a => {
    a.addEventListener(\"click\", (e) => {
      e.preventDefault();
      const h = a.getAttribute(\"data-hash\") || a.getAttribute(\"href\");
      if (h) navigateHash(h);
    });
  });

  // mode buttons delegation
  document.getElementById(\"mode-buttons\")?.addEventListener(\"click\", (e) => {
    const btn = e.target.closest && e.target.closest('button[data-mode]');
    if (btn) {
      const mode = btn.getAttribute('data-mode');
      if (mode) navigateMode(mode);
    }
  });

  // compass interactions: hover pop + needle rotation
  const compass = document.getElementById(\"compass\");
  const needle = document.getElementById(\"compass-needle\");
  function findPathElement(el){ return el && el.closest ? el.closest('path[data-mode]') : null; }

  if (compass && needle) {
    document.querySelectorAll('#compass path[data-mode]').forEach(p => {
      p.addEventListener('mouseenter', (e) => {
        const angle = Number(p.getAttribute('data-angle') || 0);
        needle.style.transform = `rotate(${angle}deg)`;
        p.style.transform = 'scale(1.03)';
        p.style.filter = 'drop-shadow(0 20px 40px rgba(0,0,0,0.12))';
      });
      p.addEventListener('mouseleave', (e) => {
        // relax needle slightly back to no rotation (0) after short delay
        setTimeout(()=> needle.style.transform = `rotate(0deg)`, 260);
        p.style.transform = '';
        p.style.filter = '';
      });

      // accessibility: focus shows same effect
      p.addEventListener('focus', () => {
        const angle = Number(p.getAttribute('data-angle') || 0);
        needle.style.transform = `rotate(${angle}deg)`;
      });
      p.addEventListener('blur', () => needle.style.transform = `rotate(0deg)`);
    });
  }

  // pointer heuristics for wedge tapping (avoid accidental activations)
  if (compass) {
    let pointerState = null;
    compass.addEventListener(\"pointerdown\", (e) => {
      if (e.isPrimary === false) return;
      const path = findPathElement(e.target);
      if (path) pointerState = { id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now(), target: path };
    }, {passive:true});
    compass.addEventListener(\"pointermove\", (e) => {
      if (!pointerState || pointerState.id !== e.pointerId) return;
      const dx = e.clientX - pointerState.x, dy = e.clientY - pointerState.y;
      if (dx*dx + dy*dy > 28*28) pointerState = null;
    }, {passive:true});
    compass.addEventListener(\"pointerup\", (e) => {
      if (!pointerState || pointerState.id !== e.pointerId) { pointerState = null; return; }
      if (Date.now() - pointerState.t < 700) {
        const mode = pointerState.target.getAttribute('data-mode');
        if (mode) navigateMode(mode);
      }
      pointerState = null;
    }, {passive:true});
    compass.addEventListener(\"pointercancel\", () => pointerState = null);
  }

  // keyboard accessibility for wedges
  document.querySelectorAll(\"#compass path[data-mode]\").forEach(p => {
    p.setAttribute(\"tabindex\",\"0\");
    p.addEventListener(\"keydown\", (e) => {
      if (e.key === \"Enter\" || e.key === \" \") {
        e.preventDefault();
        const m = p.getAttribute(\"data-mode\");
        if (m) navigateMode(m);
      }
    });
  });

  window.addEventListener(\"hashchange\", renderRoute);
  if (!location.hash) location.hash = \"#home\";
  renderRoute();
  updateStreak();
});

/* activities (unchanged source) */
const activities = {
  growing: [
    { label: \"Write a goal\", icon: \"🎯\" },
    { label: \"Tackle a challenge\", icon: \"⚒️\" },
    { label: \"Start a new project\", icon: \"🚀\" }
  ],
  grounded: [
    { label: \"Declutter a space\", icon: \"🧹\" },
    { label: \"Complete a task\", icon: \"✅\" },
    { label: \"Plan your day\", icon: \"🗓️\" }
  ],
  drifting: [
    { label: \"Go for a walk\", icon: \"🚶\" },
    { label: \"Journal your thoughts\", icon: \"✍️\" },
    { label: \"Listen to calming music\", icon: \"🎧\" }
  ],
  surviving: [
    { label: \"Drink water\", icon: \"💧\" },
    { label: \"Breathe deeply\", icon: \"🌬️\" },
    { label: \"Rest for 5 minutes\", icon: \"😴\" }
  ]
};

function navigateHash(hash){ location.hash = hash; }
function navigateMode(mode){ location.hash = `#mode/${mode}`; }

function renderRoute(){
  const h = location.hash || \"#home\";
  const isFullPage = h !== \"#home\";
  const compassContainer = document.getElementById(\"compass-container\");
  const modeButtons = document.getElementById(\"mode-buttons\");
  const howTo = document.getElementById(\"how-to\");

  if (compassContainer) compassContainer.style.display = isFullPage ? \"none\" : \"\";
  if (modeButtons) modeButtons.style.display = isFullPage ? \"none\" : \"\";
  if (howTo) howTo.style.display = isFullPage ? \"none\" : \"\";

  if (h.startsWith(\"#mode/\")) {
    const mode = h.split(\"/\")[1];
    renderModePage(mode);
  } else if (h === \"#quick\") {
    renderQuickWins();
  } else if (h === \"#history\") {
    renderHistory();
  } else if (h === \"#about\") {
    renderAbout();
  } else {
    renderHome();
  }

  // always start at top
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderHome(){
  const c = document.getElementById(\"content\");
  if (!c) return;
  c.innerHTML = \"\";
  const compassContainer = document.getElementById(\"compass-container\");
  const modeButtons = document.getElementById(\"mode-buttons\");
  const howTo = document.getElementById(\"how-to\");
  if (compassContainer) compassContainer.style.display = \"\";
  if (modeButtons) modeButtons.style.display = \"\";
  if (howTo) howTo.style.display = \"\";
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderModePage(mode){
  const c = document.getElementById(\"content\");
  if (!c) return;
  if (!activities[mode]) { c.innerHTML = `<p>Unknown mode</p>`; return; }

  c.innerHTML = `<div class=\"mode-page\" role=\"region\" aria-labelledby=\"mode-title\">
      <h2 id=\"mode-title\">${capitalize(mode)}</h2>
      ${activities[mode].map((act,i) =>
        `<div class=\"activity-row\" id=\"row-${mode}-${i}\" role=\"group\" aria-label=\"${escapeHtml(act.label)}\">
           <div class=\"activity-main\">
             <span class=\"activity-icon\" aria-hidden=\"true\">${escapeHtml(act.icon)}</span>
             <div class=\"activity-label\">${escapeHtml(act.label)}</div>
           </div>
           <textarea id=\"note-${mode}-${i}\" class=\"activity-note\" placeholder=\"Notes (optional)\" aria-label=\"Notes for ${escapeHtml(act.label)}\"></textarea>
           <div class=\"activity-controls\">
             <button class=\"btn btn-complete\" onclick=\"completeActivity('${mode}','${escapeJs(act.label)}','note-${mode}-${i}','row-${mode}-${i}')\">Complete</button>
           </div>
         </div>`
      ).join(\"\")}
      <button class=\"return-button\" onclick=\"navigateHash('#home')\">Return to the Compass</button>
    </div>`;

  // animate rows in
  const container = c.querySelector('.mode-page');
  if (container && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.from(container.querySelectorAll('.activity-row')).forEach((row,i)=>{
      row.style.animation = `fadeRow 420ms ease ${i*40}ms both`;
    });
  }

  // ensure top
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
  const entry = { date, mode, activity, note, quick: true };
  let history = JSON.parse(localStorage.getItem(\"resetHistory\") || \"[]\");
  history.unshift(entry);
  localStorage.setItem(\"resetHistory\", JSON.stringify(history));

  // increment streak if new day
  const lastLogged = localStorage.getItem(\"lastLogged\");
  const today = new Date().toLocaleDateString();
  if (lastLogged !== today){
    let streak = parseInt(localStorage.getItem(\"streak\")||\"0\",10) || 0;
    streak += 1;
    localStorage.setItem(\"streak\", String(streak));
    localStorage.setItem(\"lastLogged\", today);
    // animate streak emoji
    const streakEmoji = document.getElementById(\"streak-emoji\");
    if (streakEmoji) {
      streakEmoji.classList.add('streak-pop');
      setTimeout(()=>streakEmoji.classList.remove('streak-pop'), 1100);
    }
    updateStreak();
  }

  // celebratory confetti
  runConfettiBurst();

  // after short delay show history so user sees their entry
  setTimeout(()=>{ navigateHash('#history'); }, 700);
}

function runConfettiBurst(){
  try {
    const n = 14;
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
      dot.style.width = '10px';
      dot.style.height = '10px';
      dot.style.borderRadius = '50%';
      dot.style.background = ['#FFD166','#06D6A0','#118AB2','#EF476F'][i%4];
      dot.style.position = 'absolute';
      dot.style.left = '0';
      dot.style.top = '0';
      dot.style.opacity = '0.95';
      container.appendChild(dot);
      const angle = (Math.random()*Math.PI*2);
      const dist = 60 + Math.random()*90;
      const dx = Math.cos(angle)*dist;
      const dy = Math.sin(angle)*dist;
      dot.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.9)`, opacity: 0.9 }
      ], { duration: 650 + Math.random()*240, easing: 'cubic-bezier(.2,.9,.2,1)'});
    }

    setTimeout(()=>container.remove(), 1300);
  } catch(e){}
}

function updateStreak(){ const el = document.getElementById(\"streak-count\"); if (el) el.textContent = localStorage.getItem(\"streak\") || \"0\" }

function renderQuickWins(){
  const c = document.getElementById(\"content\");
  if (!c) return;
  const quick = [
    { label: \"Drink water\", icon: \"💧\" },
    { label: \"Stand up and stretch\", icon: \"🧘\" },
    { label: \"Take 3 deep breaths\", icon: \"🌬️\" }
  ];
  c.innerHTML = `<div class=\"mode-page\"><h2>Quick Wins</h2>` + quick.map((q,i) =>
    `<div class=\"activity-row\" id=\"row-quick-${i}\">
       <div class=\"activity-main\"><span class=\"activity-icon\">${escapeHtml(q.icon)}</span><div class=\"activity-label\">${escapeHtml(q.label)}</div></div>
       <textarea id=\"qw-${i}\" class=\"activity-note\" placeholder=\"Notes (optional)\"></textarea>
       <div class=\"activity-controls\"><button class=\"btn btn-complete\" onclick=\"completeActivity('quick','${escapeJs(q.label)}','qw-${i}','row-quick-${i}')\">Complete</button></div>
     </div>`
  ).join('') + `<button class=\"return-button\" onclick=\"navigateHash('#home')\">Return to the Compass</button></div>`;

  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderHistory(){
  const c = document.getElementById(\"content\");
  if (!c) return;
  const history = JSON.parse(localStorage.getItem(\"resetHistory\") || \"[]\");

  // compute counts per mode
  const counts = { growing:0, grounded:0, drifting:0, surviving:0, quick:0 };
  history.forEach(h => {
    const key = (h.mode||'').toLowerCase();
    if (counts[key] != null) counts[key] += 1;
    else counts[key] = (counts[key]||0) + 1;
  });
  const total = history.length || 0;

  // build donut chart area (Chart.js)
  let statsHtml = '';
  if (total === 0) {
    statsHtml = `<p>No entries yet. Complete an activity to build your streak and see stats here.</p>`;
  } else {
    statsHtml = `<div class=\"history-stats\">
      <div class=\"history-chart-wrap\"><canvas id=\"history-donut\" aria-label=\"Mode distribution\" role=\"img\"></canvas></div>
    </div>`;
  }

  // history list
  let listHtml = '';
  if (history.length === 0) {
    listHtml = '<p>No history yet.</p>';
  } else {
    listHtml = history.map(h => `<p><strong>${escapeHtml(h.date)}:</strong> ${escapeHtml(h.mode)} — ${escapeHtml(h.activity)}${h.note ? ' • <em>'+escapeHtml(h.note)+'</em>' : ''}${h.quick ? ' • (quick)' : ''}</p>`).join('');
  }

  c.innerHTML = `<div class=\"mode-page\"><h2>History</h2>${statsHtml}<div>${listHtml}</div><button class=\"return-button\" onclick=\"navigateHash('#home')\">Return to the Compass</button></div>`;

  // if we have data, draw donut via Chart.js
  if (total > 0 && typeof Chart !== 'undefined') {
    const ctx = document.getElementById('history-donut').getContext('2d');
    const labels = ['Growing','Grounded','Drifting','Surviving','Quick'];
    const data = [
      counts.growing||0,
      counts.grounded||0,
      counts.drifting||0,
      counts.surviving||0,
      counts.quick||0
    ];
    const bg = ['#007BFF','#246B45','#DAA520','#D9534F','#6c757d'];
    // destroy existing chart instance if present (prevent duplicate)
    if (window.__historyChart) try { window.__historyChart.destroy(); } catch(e){}
    window.__historyChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bg,
          hoverOffset: 10,
          borderWidth: 0
        }]
      },
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
  const c = document.getElementById(\"content\");
  if (!c) return;
  c.innerHTML = `<div class=\"mode-page\"><h2>About</h2>
    <p>The Reset Compass was created by Marcus Clark to help you align energy and action with your state. Questions? <a href=\"mailto:evolutionofwellness@gmail.com\">Contact Support</a></p>
    <button class=\"return-button\" onclick=\"navigateHash('#home')\">Return to the Compass</button></div>`;
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