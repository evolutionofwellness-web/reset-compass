// app.js - stable routing + pointer handling + page hiding

document.addEventListener("DOMContentLoaded", () => {
  // splash overlay: hidden after animation
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    if (splash) splash.style.display = "none";
  }, 1200);

  // delegated pointer handler for compass (works on mobile browsers)
  const compass = document.getElementById("compass");
  if (compass) {
    compass.addEventListener("pointerdown", (e) => {
      const path = e.target.closest && e.target.closest('path[data-mode]');
      if (path) {
        const mode = path.getAttribute('data-mode');
        if (mode) navigateMode(mode);
      }
    });
    // fallback click
    compass.addEventListener("click", (e) => {
      const path = e.target.closest && e.target.closest('path[data-mode]');
      if (path) {
        const mode = path.getAttribute('data-mode');
        if (mode) navigateMode(mode);
      }
    });
  }

  // keyboard support
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

function navigateHash(hash){ location.hash = hash }
function navigateMode(mode){ location.hash = `#mode/${mode}` }

function renderRoute(){
  const h = location.hash || "#home";
  const isMode = h.startsWith("#mode/");
  // toggle compass + button visibility so mode feels like a separate page
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
  c.innerHTML = `<h2>${capitalize(mode)}</h2>` +
    activities[mode].map((act,i) =>
      `<div class="activity-row">
         <label>${escapeHtml(act)}</label>
         <input type="text" id="note-${mode}-${i}" placeholder="Notes (optional)">
         <button onclick="logActivity('${mode}','${escapeJs(act)}','note-${mode}-${i}')">Log</button>
       </div>`
    ).join('') +
    `<div style="margin-top:12px"><a href="#home" onclick="navigateHash('#home')">🡐 Back</a></div>`;
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
  if (c) c.innerHTML = `<p>Logged: <strong>${escapeHtml(activity)}</strong> (${escapeHtml(mode)}) • ${escapeHtml(date)}</p>
    <p><a href="#mode/${mode}" onclick="navigateMode('${mode}')">Back to ${capitalize(mode)}</a> • <a href="#home" onclick="navigateHash('#home')">Home</a></p>`;
}

function updateStreak(){ const el = document.getElementById("streak-count"); if (el) el.textContent = localStorage.getItem("streak") || "0" }

function renderQuickWins(){
  const c = document.getElementById("content");
  if (!c) return;
  const quick = ["Drink water","Stand up and stretch","Take 3 deep breaths"];
  c.innerHTML = `<h2>Quick Wins</h2>` + quick.map((q,i) =>
    `<div class="activity-row"><label>${escapeHtml(q)}</label><input id="qw-${i}" placeholder="Notes (optional)"><button onclick="logActivity('quick','${escapeJs(q)}','qw-${i}')">Log</button></div>`
  ).join('') + `<div style="margin-top:12px"><a href="#home" onclick="navigateHash('#home')">🡐 Back</a></div>`;
}

function renderHistory(){
  const c = document.getElementById("content");
  if (!c) return;
  const history = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  c.innerHTML = `<h2>History</h2>` + (history.length ? history.map(h =>
    `<p><strong>${escapeHtml(h.date)}:</strong> ${escapeHtml(h.mode)} — ${escapeHtml(h.activity)}${h.note ? ' • <em>'+escapeHtml(h.note)+'</em>' : ''}</p>`
  ).join('') : `<p>No history yet.</p>`) + `<div style="margin-top:12px"><a href="#home" onclick="navigateHash('#home')">🡐 Back</a></div>`;
}

function renderAbout(){
  const c = document.getElementById("content");
  if (!c) return;
  c.innerHTML = `<h2>About</h2>
    <p>The Reset Compass was created by Marcus Clark to help you align energy and action with your state. Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p>
    <div style="margin-top:12px"><a href="#home" onclick="navigateHash('#home')">🡐 Back</a></div>`;
}

function capitalize(s){ return (s||'').charAt(0).toUpperCase()+ (s||'').slice(1) }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }
function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/\"/g,'\\"') }