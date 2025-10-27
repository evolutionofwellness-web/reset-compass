// app.js - added entrance animations and stagger logic for Chrome on iPhone (respects reduced motion)

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const splashSvg = document.getElementById("splash-svg");
  if (splashSvg) {
    splashSvg.addEventListener("animationend", () => { if (splash) splash.style.display = "none"; });
    setTimeout(() => { if (splash) splash.style.display = "none"; }, 2200);
  } else if (splash) {
    splash.style.display = "none";
  }

  // top nav wiring
  document.querySelectorAll(".nav-links a[data-hash]").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const h = a.getAttribute("data-hash") || a.getAttribute("href");
      if (h) navigateHash(h);
    });
  });

  // mode list delegation
  document.getElementById("mode-buttons")?.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest('button[data-mode]');
    if (btn) {
      const mode = btn.getAttribute('data-mode');
      if (mode) navigateMode(mode);
    }
  });

  // Compass tap detection (prevent accidental activation while scrolling)
  const compass = document.getElementById("compass");
  let pointerState = null;
  function findPathElement(el){ return el && el.closest ? el.closest('path[data-mode]') : null; }

  if (compass) {
    compass.addEventListener("pointerdown", (e) => {
      if (e.isPrimary === false) return;
      const path = findPathElement(e.target);
      pointerState = null;
      if (path) {
        pointerState = { id: e.pointerId, startX: e.clientX, startY: e.clientY, startTime: Date.now(), targetPath: path };
      }
    }, {passive:true});

    compass.addEventListener("pointermove", (e) => {
      if (!pointerState || pointerState.id !== e.pointerId) return;
      const dx = e.clientX - pointerState.startX;
      const dy = e.clientY - pointerState.startY;
      if (dx*dx + dy*dy > 28*28) { pointerState = null; }
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

  // keyboard accessibility for wedges
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

/* activities - with emoji icons for quick visual pop */
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
  // treat anything not '#home' as a full page (hide compass/list)
  const isFullPage = h !== "#home";
  const compassContainer = document.getElementById("compass-container");
  const modeButtons = document.getElementById("mode-buttons");
  if (compassContainer) { compassContainer.classList.toggle('hidden', isFullPage); compassContainer.setAttribute('aria-hidden', isFullPage ? 'true' : 'false'); }
  if (modeButtons) { modeButtons.classList.toggle('hidden', isFullPage); modeButtons.setAttribute('aria-hidden', isFullPage ? 'true' : 'false'); }

  if (h.startsWith("#mode/")) {
    const mode = h.split("/")[1];
    renderModePage(mode);
    document.getElementById("content")?.scrollIntoView({behavior:"auto",block:"start"});
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

/* utility: check reduced motion */
function reducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function animateContentRows(container) {
  if (reducedMotion()) return;
  const rows = Array.from(container.querySelectorAll('.activity-row'));
  rows.forEach((row, i) => {
    row.classList.remove('animate-in');
    row.style.animationDelay = `${i * 70}ms`;
    // trigger reflow then add class
    // eslint-disable-next-line no-unused-expressions
    row.offsetHeight;
    row.classList.add('animate-in');
  });

  // animate any icons/labels (compass labels when present)
  const content = document.getElementById('content');
  content?.classList.add('content-anim');
  setTimeout(() => { content?.classList.remove('content-anim'); }, 700);
}

function animateHomeButtons() {
  if (reducedMotion()) return;
  const container = document.getElementById('mode-buttons');
  if (!container) return;
  const buttons = Array.from(container.querySelectorAll('.mode-button'));
  buttons.forEach((btn, i) => {
    btn.classList.remove('pop-in');
    btn.style.animationDelay = `${i * 80 + 60}ms`;
    // reflow
    // eslint-disable-next-line no-unused-expressions
    btn.offsetHeight;
    btn.classList.add('pop-in');
  });
}

function renderHome(){
  const c = document.getElementById("content");
  if (!c) return;
  c.innerHTML = ""; // home intentionally minimal
  // animate home buttons slightly
  setTimeout(animateHomeButtons, 80);
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
           <button onclick="logActivity('${mode}','${escapeJs(act.label)}','note-${mode}-${i}')">Log</button>
         </div>`
      ).join("")}
      <button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button>
    </div>`;

  // stagger animate rows
  const container = c.querySelector('.mode-page');
  if (container) animateContentRows(container);
}

function logActivity(mode, activity, noteId){
  const date = new Date().toLocaleDateString();
  const note = noteId ? (document.getElementById(noteId)?.value || "") : "";
  const entry = { date, mode, activity, note };
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
    `<div class="activity-row"><div class="activity-label-wrap"><span class="activity-icon">${escapeHtml(q.icon)}</span><label>${escapeHtml(q.label)}</label></div><input id="qw-${i}" placeholder="Notes (optional)"><button onclick="logActivity('quick','${escapeJs(q.label)}','qw-${i}')">Log</button></div>`
  ).join('') + `<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;

  const container = c.querySelector('.mode-page');
  if (container) animateContentRows(container);
}

function renderHistory(){
  const c = document.getElementById("content");
  if (!c) return;
  const history = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  c.innerHTML = `<div class="mode-page"><h2>History</h2>` + (history.length ? history.map(h =>
    `<p><strong>${escapeHtml(h.date)}:</strong> ${escapeHtml(h.mode)} — ${escapeHtml(h.activity)}${h.note ? ' • <em>'+escapeHtml(h.note)+'</em>' : ''}</p>`
  ).join('') : `<p>No history yet.</p>`) + `<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;

  // small entrance for the page
  if (!reducedMotion()) {
    const page = c.querySelector('.mode-page');
    page?.classList.add('animate-in');
  }
}

function renderAbout(){
  const c = document.getElementById("content");
  if (!c) return;
  c.innerHTML = `<div class="mode-page"><h2>About</h2>
    <p>The Reset Compass was created by Marcus Clark to help you align energy and action with your state. Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p>
    <button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;

  if (!reducedMotion()) {
    const page = c.querySelector('.mode-page');
    page?.classList.add('animate-in');
  }
}

function capitalize(s){ return (s||'').charAt(0).toUpperCase()+ (s||'').slice(1) }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }
function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/\"/g,'\\"') }