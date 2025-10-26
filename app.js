// app.js: robust tap-detection, route logging for debug, splash animation handling

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const splashSvg = document.getElementById("splash-svg");
  if (splashSvg) {
    splashSvg.addEventListener("animationend", () => {
      if (splash) splash.style.display = "none";
      console.log("[reset] splash animationend -> hidden");
    });
    // fallback
    setTimeout(() => { if (splash) splash.style.display = "none"; }, 2400);
  } else if (splash) {
    splash.style.display = "none";
  }

  console.log("[reset] script loaded. app.js?v=52");

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

  // Compass: tap-detection (reduce accidental activations while scrolling)
  const compass = document.getElementById("compass");
  let pointerState = null;
  function findPathElement(el){ return el && el.closest ? el.closest('path[data-mode]') : null; }

  if (compass) {
    console.log("[reset] compass element found");
    compass.addEventListener("pointerdown", (e) => {
      if (e.isPrimary === false) return;
      const path = findPathElement(e.target);
      pointerState = null;
      if (path) {
        pointerState = {
          id: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startTime: Date.now(),
          targetPath: path
        };
      }
    }, {passive:true});

    // larger movement threshold (28px) to avoid accidental triggers while scrolling
    compass.addEventListener("pointermove", (e) => {
      if (!pointerState || pointerState.id !== e.pointerId) return;
      const dx = e.clientX - pointerState.startX;
      const dy = e.clientY - pointerState.startY;
      if (dx*dx + dy*dy > 28*28) { // cancel if moved > 28px
        pointerState = null;
      }
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
  } else {
    console.warn("[reset] compass element NOT found");
  }

  // keyboard accessibility
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
  growing: ["Write a goal", "Tackle a challenge", "Start a new project"],
  grounded: ["Declutter a space", "Complete a task", "Plan your day"],
  drifting: ["Go for a walk", "Journal your thoughts", "Listen to calming music"],
  surviving: ["Drink water", "Breathe deeply", "Rest for 5 minutes"]
};

function navigateHash(hash){ location.hash = hash; }
function navigateMode(mode){ location.hash = `#mode/${mode}`; }

function renderRoute(){
  const h = location.hash || "#home";
  console.log("[reset] renderRoute:", h);
  const isMode = h.startsWith("#mode/");
  const compassContainer = document.getElementById("compass-container");
  const modeButtons = document.getElementById("mode-buttons");

  if (compassContainer) { compassContainer.classList.toggle('hidden', isMode); compassContainer.setAttribute('aria-hidden', isMode ? 'true' : 'false'); }
  if (modeButtons) { modeButtons.classList.toggle('hidden', isMode); modeButtons.setAttribute('aria-hidden', isMode ? 'true' : 'false'); }

  if (isMode) {
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

function renderHome(){
  const c = document.getElementById("content");
  if (!c) return;
  c.innerHTML = ""; // intentionally empty (no helper text)
}

function renderModePage(mode){
  const c = document.getElementById("content");
  if (!c) return;
  if (!activities[mode]) { c.innerHTML = `<p>Unknown mode</p>`; return; }
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