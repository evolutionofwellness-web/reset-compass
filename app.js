// app.js v23 (corrected escape helpers)
// - Uses splash-icon.png intro and hides overlay on animationend (with fallback)
// - Ensures compass + mode list are hidden for full pages (non-home) via style.display
// - Prevents an initial mode from appearing by forcing home on first load (consistent startup UX)
// - Improved activity layout and controls group so controls never overlap

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const splashIcon = document.getElementById("splash-icon");

  // Hide splash when animation completes (or after fallback delay)
  if (splashIcon) {
    splashIcon.addEventListener("animationend", () => { if (splash) splash.style.display = "none"; }, { once: true });
    setTimeout(() => { if (splash) splash.style.display = "none"; }, 1800);
  } else if (splash) {
    splash.style.display = "none";
  }

  // Always start at the homepage on initial load (prevents leftover hash from showing a mode immediately).
  // Use replaceState so we don't push a history entry.
  if (!sessionStorage.getItem('appStarted')) {
    sessionStorage.setItem('appStarted', 'true');
    history.replaceState(null, '', '#home');
  } else {
    if (!location.hash) location.hash = '#home';
  }

  // wire nav links
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

  // compass tap detection (prevent accidental activation while scrolling)
  const compass = document.getElementById("compass");
  let pointerState = null;
  function findPathElement(el){ return el && el.closest ? el.closest('path[data-mode]') : null; }

  if (compass) {
    compass.addEventListener("pointerdown", (e) => {
      if (e.isPrimary === false) return;
      const path = findPathElement(e.target);
      pointerState = null;
      if (path) pointerState = { id: e.pointerId, startX: e.clientX, startY: e.clientY, startTime: Date.now(), targetPath: path };
    }, {passive:true});

    compass.addEventListener("pointermove", (e) => {
      if (!pointerState || pointerState.id !== e.pointerId) return;
      const dx = e.clientX - pointerState.startX; const dy = e.clientY - pointerState.startY;
      if (dx*dx + dy*dy > 28*28) pointerState = null;
    }, {passive:true});

    compass.addEventListener("pointerup", (e) => {
      if (!pointerState || pointerState.id !== e.pointerId) { pointerState = null; return; }
      const elapsed = Date.now() - pointerState.startTime;
      if (elapsed < 700) {
        const mode = pointerState.targetPath && pointerState.targetPath.getAttribute('data-mode');
        if (mode) navigateMode(mode);
      }
      pointerState = null;
    });

    compass.addEventListener("pointercancel", () => { pointerState = null; });
    compass.addEventListener("click", (e) => {
      const path = findPathElement(e.target);
      if (path) {
        const mode = path.getAttribute('data-mode');
        if (mode) navigateMode(mode);
      }
    });
  }

  // keyboard support for wedges
  document.querySelectorAll("#compass path[data-mode]").forEach(p => {
    p.setAttribute("tabindex","0");
    p.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const m = p.getAttribute("data-mode");
        if (m) navigateMode(m);
      }
    });
  });

  window.addEventListener("hashchange", renderRoute);
  if (!location.hash) location.hash = "#home";
  renderRoute();
  updateStreak();
});

/* activities */
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

  // Direct style changes so hiding/showing is robust even if CSS is cached/overridden.
  if (compassContainer) compassContainer.style.display = isFullPage ? "none" : "";
  if (modeButtons) modeButtons.style.display = isFullPage ? "none" : "";

  if (h.startsWith("#mode/")) {
    const mode = h.split("/")[1];
    renderModePage(mode);
    // Ensure the content is scrolled into view and the nav isn't overlapping
    document.getElementById("content")?.scrollIntoView({behavior:"auto",block:"start"});
    window.scrollTo({ top: document.getElementById('page').offsetTop, behavior: 'auto' });
  } else if (h === "#quick") {
    renderQuickWins();
  } else if (h === "#history") {
    renderHistory();
  } else if (h === "#about") {
    renderAbout();
  } else {
    renderHome();
  }
}

function renderHome(){
  const c = document.getElementById("content");
  if (!c) return;
  c.innerHTML = ""; // home intentionally minimal (hero + compass visible)
  // ensure compass and buttons are visible in case anything forced them hidden
  const compassContainer = document.getElementById("compass-container");
  const modeButtons = document.getElementById("mode-buttons");
  if (compassContainer) compassContainer.style.display = "";
  if (modeButtons) modeButtons.style.display = "";
  // scroll to top of main area so hero + compass are visible
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function renderModePage(mode){
  const c = document.getElementById("content");
  if (!c) return;
  if (!activities[mode]) { c.innerHTML = `<p>Unknown mode</p>`; return; }

  c.innerHTML = `<div class="mode-page">
      <h2>${capitalize(mode)}</h2>
      ${activities[mode].map((act,i) =>
        `<div class="activity-row">
           <div class="activity-label-wrap"><span class="activity-icon">${escapeHtml(act.icon)}</span><label>${escapeHtml(act.label)}</label></div>
           <input type="text" id="note-${mode}-${i}" placeholder="Notes (optional)">
           <div class="activity-controls">
             <button class="quick-btn" onclick="quickMarkDone('${mode}','${escapeJs(act.label)}')">✓</button>
             <button class="log-btn" onclick="logActivity('${mode}','${escapeJs(act.label)}','note-${mode}-${i}')">Note</button>
           </div>
         </div>`
      ).join("")}
      <button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button>
    </div>`;

  // stagger animate rows (if allowed)
  const container = c.querySelector('.mode-page');
  if (container && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.from(container.querySelectorAll('.activity-row')).forEach((row,i)=>{
      row.style.animation = `fadeRow 420ms ease ${i*60}ms both`;
    });
  }
}

function quickMarkDone(mode, activity){
  const date = new Date().toLocaleDateString();
  const entry = { date, mode, activity, note: "", quick: true };
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
    updateStreak();
  }
  try {
    const toast = document.createElement('div');
    toast.textContent = 'Marked done ✓';
    toast.style.position='fixed'; toast.style.right='14px'; toast.style.bottom='86px';
    toast.style.background='rgba(11,61,46,0.95)'; toast.style.color='white'; toast.style.padding='8px 12px';
    toast.style.borderRadius='10px'; toast.style.zIndex=99999; document.body.appendChild(toast);
    setTimeout(()=>toast.remove(),900);
  } catch(e){}
}

function logActivity(mode, activity, noteId){
  const date = new Date().toLocaleDateString();
  const note = noteId ? (document.getElementById(noteId)?.value || "") : "";
  const entry = { date, mode, activity, note, quick: false };
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
    updateStreak();
  }

  const c = document.getElementById("content");
  if (c) c.innerHTML = `<div class="mode-page"><p>Logged: <strong>${escapeHtml(activity)}</strong> (${escapeHtml(mode)}) • ${escapeHtml(date)}</p>
    <button class="return-button" onclick="navigateHash('#mode/${mode}')">Return to the Compass</button>
    </div>`;
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
    `<div class="activity-row"><div class="activity-label-wrap"><span class="activity-icon">${escapeHtml(q.icon)}</span><label>${escapeHtml(q.label)}</label></div><input id="qw-${i}" placeholder="Notes (optional)"><div class="activity-controls"><button class="quick-btn" onclick="quickMarkDone('quick','${escapeJs(q.label)}')">✓</button><button class="log-btn" onclick="logActivity('quick','${escapeJs(q.label)}','qw-${i}')">Note</button></div></div>`
  ).join('') + `<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;

  const container = c.querySelector('.mode-page');
  if (container && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.from(container.querySelectorAll('.activity-row')).forEach((row,i)=>{
      row.style.animation = `fadeRow 420ms ease ${i*60}ms both`;
    });
  }
}

function renderHistory(){
  const c = document.getElementById("content");
  if (!c) return;
  const history = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  c.innerHTML = `<div class="mode-page"><h2>History</h2>` + (history.length ? history.map(h =>
    `<p><strong>${escapeHtml(h.date)}:</strong> ${escapeHtml(h.mode)} — ${escapeHtml(h.activity)}${h.note ? ' • <em>'+escapeHtml(h.note)+'</em>' : ''}${h.quick ? ' • (quick)' : ''}</p>`
  ).join('') : `<p>No history yet.</p>`) + `<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;
}

function renderAbout(){
  const c = document.getElementById("content");
  if (!c) return;
  c.innerHTML = `<div class="mode-page"><h2>About</h2>
    <p>The Reset Compass was created by Marcus Clark to help you align energy and action with your state. Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p>
    <button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;
}

function capitalize(s){ return (s||'').charAt(0).toUpperCase()+ (s||'').slice(1) }
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/\"/g,'\\"') }

/* add keyframe for fadeRow if missing */
(function(){
  try {
    const style = document.createElement('style');
    style.textContent = `@keyframes fadeRow{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`;
    document.head.appendChild(style);
  } catch(e){}
})();