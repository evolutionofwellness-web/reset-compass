// app.js v25
// - Single "Complete" action per activity which logs the entry (with note), increments streak, animates, then navigates to History.
// - Nav centered and slightly larger font handled in CSS.
// - Compass wedges get a thin light stroke to create a visual gap.
// - Return to Compass fixed (navigateHash('#home')).
// - Splash animation slowed and grows large; fallback ensures it hides.

// Helper: safe HTML escaping
function escapeHtml(s){
  return String(s||'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/\"/g,'\\"') }

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const splashIcon = document.getElementById("splash-icon");

  if (splashIcon) {
    splashIcon.addEventListener("animationend", () => { if (splash) splash.style.display = "none"; }, { once: true });
    // fallback
    setTimeout(() => { if (splash) splash.style.display = "none"; }, 2600);
  } else if (splash) {
    splash.style.display = "none";
  }

  // start at home first-run
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

  // mode button delegation
  document.getElementById("mode-buttons")?.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest('button[data-mode]');
    if (btn) {
      const mode = btn.getAttribute('data-mode');
      if (mode) navigateMode(mode);
    }
  });

  // compass wedge selection (pointer heuristics to avoid accidental activation)
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
}

function completeActivity(mode, activity, noteId, rowId){
  // animate the row immediately
  const row = document.getElementById(rowId);
  if (row) {
    row.classList.add('activity-complete-pop');
  }

  // pickup note text if present
  const note = noteId ? (document.getElementById(noteId)?.value || "") : "";

  // add a history entry
  const date = new Date().toLocaleDateString();
  const entry = { date, mode, activity, note, quick: false };
  let history = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  history.unshift(entry);
  localStorage.setItem("resetHistory", JSON.stringify(history));

  // increment streak if a new day
  const lastLogged = localStorage.getItem("lastLogged");
  const today = new Date().toLocaleDateString();
  if (lastLogged !== today){
    let streak = parseInt(localStorage.getItem("streak")||"0",10) || 0;
    streak += 1;
    localStorage.setItem("streak", String(streak));
    localStorage.setItem("lastLogged", today);
    // animate streak
    const streakEl = document.getElementById("streak");
    if (streakEl) {
      streakEl.classList.add('streak-pop');
      // brief heart/fire sparkle (we already show the emoji in text)
      setTimeout(()=>streakEl.classList.remove('streak-pop'), 1100);
      updateStreak();
    }
  }

  // small confetti burst (simple DOM dots) to make it feel celebratory
  runConfettiBurst();

  // after a short pause let user see animation, then go to history
  setTimeout(()=>{ navigateHash('#history'); }, 700);
}

function runConfettiBurst(){
  try {
    const n = 14;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '50%';
    container.style.top = '38%';
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
      dot.style.transform = `translate(0,0)`;
      container.appendChild(dot);
      const angle = (Math.random()*Math.PI*2);
      const dist = 60 + Math.random()*80;
      const dx = Math.cos(angle)*dist;
      const dy = Math.sin(angle)*dist;
      dot.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.9)`, opacity: 0.9 }
      ], { duration: 650 + Math.random()*220, easing: 'cubic-bezier(.2,.9,.2,1)'});
    }

    setTimeout(()=>container.remove(), 1200);
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
       <div class="activity-controls"><button class="btn btn-complete" onclick="completeActivity('quick','${escapeJs(q.label)}','qw-${i}','row-quick-${i}')">Complete</button></div>
     </div>`
  ).join('') + `<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;

  const container = c.querySelector('.mode-page');
  if (container && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.from(container.querySelectorAll('.activity-row')).forEach((row,i)=>{
      row.style.animation = `fadeRow 420ms ease ${i*40}ms both`;
    });
  }
}

function renderHistory(){
  const c = document.getElementById("content");
  if (!c) return;
  const history = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  c.innerHTML = `<div class="mode-page"><h2>History</h2>` + (history.length ? history.map(h =>
    `<p><strong>${escapeHtml(h.date)}:</strong> ${escapeHtml(h.mode)} — ${escapeHtml(h.activity)}${h.note ? ' • <em>'+escapeHtml(h.note)+'</em>' : ''}</p>`
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

/* add fadeRow keyframe if missing */
(function(){
  try {
    const style = document.createElement('style');
    style.textContent = `@keyframes fadeRow{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`;
    document.head.appendChild(style);
  } catch(e){}
})();