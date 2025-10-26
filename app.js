// app.js - fixes:
// - splash animation (animationend hides overlay) and large zoom/fade
// - nav links wired to routing (click handlers + anchors fallback)
// - wedges pointer handling + keyboard
// - labels moved further from center
// - improved mode page styling and "Return to the Compass" button

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const splashIcon = document.getElementById("splash-icon");

  // Ensure splash overlay is removed after its animation completes
  if (splashIcon) {
    splashIcon.addEventListener("animationend", () => {
      if (splash) splash.style.display = "none";
    });
    // fallback in case animationend doesn't fire
    setTimeout(() => { if (splash) splash.style.display = "none"; }, 1600);
  } else {
    if (splash) splash.style.display = "none";
  }

  // Wire top nav links to the router (prevent default but allow anchor fallback)
  document.querySelectorAll(".nav-links a[data-hash]").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const h = a.getAttribute("data-hash") || a.getAttribute("href");
      if (h) navigateHash(h);
    });
  });

  // Wire mode buttons (list) using delegation
  document.getElementById("mode-buttons")?.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest('button[data-mode]');
    if (btn) {
      const mode = btn.getAttribute('data-mode');
      if (mode) navigateMode(mode);
    }
  });

  // Delegated pointer handler for the SVG compass (works well on mobile)
  const compass = document.getElementById("compass");
  if (compass) {
    const handleModeClick = (target) => {
      const path = target.closest && target.closest('path[data-mode]');
      if (path) {
        const m = path.getAttribute('data-mode');
        if (m) navigateMode(m);
      }
    };
    compass.addEventListener("pointerdown", (e) => handleModeClick(e.target));
    compass.addEventListener("click", (e) => handleModeClick(e.target));
  }

  // keyboard support - ensure wedge paths are focusable
  document.querySelectorAll("#compass path[data-mode]").forEach(p => {
    p.setAttribute("tabindex", "0");
    p.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const m = p.getAttribute("data-mode");
        if (m) navigateMode(m);
      }
    });
  });

  // hash routing
  window.addEventListener("hashchange", renderRoute);
  renderRoute();

  updateStreak();
});

/* activities */
const activities = {
  growing: ["Write a goal", "Tackle a challenge", "Start a new project"],
  grounded: ["Declutter a space", "Complete a task", "Plan your day"],
  drifting: ["Go for a walk", "Journal your thoughts", "Listen to calming music"],
  surviving: ["Drink water", "Breathe deeply", "Rest for 5 minutes"]
};

function navigateHash(hash){
  // normalize
  location.hash = hash;
}
function navigateMode(mode){
  location.hash = `#mode/${mode}`;
}

function renderRoute(){
  const h = location.hash || "#home";
  const isMode = h.startsWith("#mode/");
  // toggle compass + list visibility to make mode feel like separate page
  const compassContainer = document.getElementById("compass-container");
  const modeButtons = document.getElementById("mode-buttons");
  if (compassContainer) compassContainer.style.display = isMode ? "none" : "";
  if (modeButtons) modeButtons.style.display = isMode ? "none" : "";

  if (isMode){
    const mode = h.split("/")[1];
    renderModePage(mode);
  } else if (h === "#quick"){
    renderQuickWins();
  } else if (h === "#history"){
    renderHistory();
  } else if (h === "#about"){
    renderAbout();
  } else {
    renderHome();
  }
}

function renderHome(){
  const c = document.getElementById("content");
  if (!c) return;
  c.innerHTML = `<p class="card" style="margin-top:10px">Choose a mode from the compass above or the list below to get started.</p>`;
}

function renderModePage(mode){
  const c = document.getElementById("content");
  if (!c) return;
  if (!activities[mode]) { c.innerHTML = `<p>Unknown mode</p>`; return; }

  // Build a styled mode page with prominent "Return to the Compass" button
  c.innerHTML = `<div class="mode-page">
      <h2>${capitalize(mode)}</h2>
      ${activities[mode].map((act,i) =>
        `<div class="activity-row">
           <label>${escapeHtml(act)}</label>
           <input type="text" id="note-${mode}-${i}" placeholder="Notes (optional)">
           <button onclick="logActivity('${mode}','${escapeJs(act)}','note-${mode}-${i}')">Log</button>
         </div>`
      ).join("")}
      <button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button>
    </div>`;
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
  const quick = ["Drink water","Stand up and stretch","Take 3 deep breaths"];
  c.innerHTML = `<div class="mode-page"><h2>Quick Wins</h2>` + quick.map((q,i) =>
    `<div class="activity-row"><label>${escapeHtml(q)}</label><input id="qw-${i}" placeholder="Notes (optional)"><button onclick="logActivity('quick','${escapeJs(q)}','qw-${i}')">Log</button></div>`
  ).join('') + `<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;
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
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }
function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/\"/g,'\\"') }