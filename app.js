document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const welcome = document.getElementById("welcomePopup");
  const app = document.getElementById("appContent");

  setTimeout(() => {
    splash.style.display = "none";
    if (!localStorage.getItem("visited")) {
      welcome.style.display = "flex";
      localStorage.setItem("visited", "true");
    } else {
      app.style.display = "block";
      renderHome();
    }
  }, 2000);
});

function closeWelcome() {
  document.getElementById("welcomePopup").style.display = "none";
  document.getElementById("appContent").style.display = "block";
  renderHome();
}

const MODES = {
  Surviving: { color: "var(--surviving)", desc: "Barely getting through the day" },
  Drifting: { color: "var(--drifting)", desc: "Lacking direction or purpose" },
  Grounded: { color: "var(--grounded)", desc: "Stable and present" },
  Growing: { color: "var(--growing)", desc: "Making consistent progress" }
};

function renderHome() {
  const main = document.getElementById("mainContent");
  main.innerHTML = `
    <h2>🔥 ${getStreak()}-day streak</h2>
    <svg width="300" height="300" viewBox="0 0 300 300">
      ${Object.keys(MODES).map((mode, i) => `
        <path d="${describeArc(150,150,140,i*90,(i+1)*90)}" fill="${MODES[mode].color}" onclick="selectMode('${mode}')"></path>
        <text x="${150 + 100 * Math.cos((i*90+45)*Math.PI/180)}" y="${150 + 100 * Math.sin((i*90+45)*Math.PI/180)}"
          class="wedge-label">${mode}</text>
      `).join("")}
    </svg>
    ${Object.keys(MODES).map(mode => `
      <div class="mode-button" style="background:${MODES[mode].color}" onclick="selectMode('${mode}')">
        <strong>${mode}</strong><br>${MODES[mode].desc}
      </div>
    `).join("")}
  `;
}

function describeArc(cx, cy, r, start, end) {
  const startRad = (Math.PI/180)*(start-90);
  const endRad = (Math.PI/180)*(end-90);
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`;
}

function selectMode(mode) {
  const log = JSON.parse(localStorage.getItem("logs") || "[]");
  const today = new Date().toISOString().split("T")[0];
  if (!log.find(entry => entry.date === today)) {
    log.push({ date: today, mode, entry: "" });
    localStorage.setItem("logs", JSON.stringify(log));
  }
  renderModePage(mode);
}

function renderModePage(mode) {
  const main = document.getElementById("mainContent");
  main.innerHTML = `
    <h2>${mode}</h2>
    <p>${MODES[mode].desc}</p>
    <textarea id="entryBox" rows="6" placeholder="What did you do today?" onblur="saveEntry('${mode}')"></textarea>
    <br><button onclick="navigate('home')">Back</button>
  `;
}

function saveEntry(mode) {
  const text = document.getElementById("entryBox").value;
  const log = JSON.parse(localStorage.getItem("logs") || "[]");
  const today = new Date().toISOString().split("T")[0];
  const i = log.findIndex(entry => entry.date === today && entry.mode === mode);
  if (i >= 0) {
    log[i].entry = text;
    localStorage.setItem("logs", JSON.stringify(log));
  }
}

function navigate(view) {
  if (view === "home") renderHome();
  if (view === "quickWins") renderQuickWins();
  if (view === "history") renderHistory();
  if (view === "about") {
    document.getElementById("mainContent").innerHTML = `
      <h2>About</h2>
      <p>This tool helps you track your daily wellness mode and take action.</p>
    `;
  }
}

function renderQuickWins() {
  const main = document.getElementById("mainContent");
  main.innerHTML = `
    <h2>Quick Wins</h2>
    <ul>
      ${["Drink water", "Step outside", "Stretch for 1 minute", "Take a deep breath"].map(win => `
        <li><strong>${win}</strong><br><textarea rows="3" placeholder="What did you do?"></textarea></li>
      `).join("")}
    </ul>
    <button onclick="navigate('home')">Back</button>
  `;
}

function renderHistory() {
  const main = document.getElementById("mainContent");
  const log = JSON.parse(localStorage.getItem("logs") || "[]");
  main.innerHTML = `
    <h2>Your History</h2>
    <p>🔥 ${getStreak()}-day streak</p>
    <ul>${log.map(entry => `<li>${entry.date}: ${entry.mode} – ${entry.entry}</li>`).join("")}</ul>
    <button onclick="navigate('home')">Back</button>
  `;
}

function getStreak() {
  const log = JSON.parse(localStorage.getItem("logs") || "[]").sort((a,b)=>new Date(b.date)-new Date(a.date));
  let streak = 0;
  let date = new Date();
  for (const entry of log) {
    const entryDate = new Date(entry.date);
    if (entryDate.toDateString() === date.toDateString()) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}