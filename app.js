// app.js?v=12
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("splashScreen").style.display = "none";
    if (!localStorage.getItem("welcomeShown")) {
      document.getElementById("welcomeModal").classList.remove("hidden");
    } else {
      document.getElementById("appContent").classList.remove("hidden");
    }
  }, 2000);

  document.querySelectorAll("#compass path").forEach(path => {
    path.addEventListener("click", () => {
      const mode = path.getAttribute("data-mode");
      selectMode(mode);
    });
  });

  renderStreak();
  renderHistory();
});

function startApp() {
  localStorage.setItem("welcomeShown", "true");
  document.getElementById("welcomeModal").classList.add("hidden");
  document.getElementById("appContent").classList.remove("hidden");
}

function showHome() {
  showSection("homeSection");
}

function showQuickWins() {
  showSection("quickWinsSection");
}

function showHistory() {
  showSection("historySection");
  renderStreak();
  renderHistory();
}

function showAbout() {
  showSection("aboutSection");
}

function showSection(id) {
  document.querySelectorAll("main > section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function selectMode(mode) {
  const activities = {
    Surviving: ["Drink water", "Take 5 breaths", "Do one tiny task"],
    Drifting: ["Take 5 slow breaths", "Journal one thought", "Reconnect to one intention"],
    Grounded: ["Stretch for 2 minutes", "Step outside", "Eat a full meal"],
    Growing: ["Do a hard thing first", "Make a bold request", "Reflect on what’s next"]
  };

  const section = document.getElementById("modeSection");
  section.innerHTML = `<h2>${mode} Mode</h2>` +
    activities[mode].map(item => `
      <div>
        <strong>${item}</strong>
        <textarea placeholder="What did you do?"></textarea>
      </div>`).join('') +
    `<button onclick="saveModeChoice('${mode}')">Save My Reset</button>`;

  showSection("modeSection");
}

function saveModeChoice(mode) {
  const today = new Date().toLocaleDateString();
  const existing = JSON.parse(localStorage.getItem("modeLog") || "[]");
  if (!existing.find(entry => entry.date === today)) {
    existing.push({ date: today, mode });
    localStorage.setItem("modeLog", JSON.stringify(existing));
  }

  const entries = [...document.querySelectorAll("#modeSection textarea")].map(t => ({
    activity: t.previousElementSibling.innerText,
    note: t.value
  }));

  const history = JSON.parse(localStorage.getItem("history") || "[]");
  history.push({ mode, date: today, entries });
  localStorage.setItem("history", JSON.stringify(history));

  alert("Reset saved!");
  showHome();
  renderStreak();
  renderHistory();
}

function renderHistory() {
  const modeLog = JSON.parse(localStorage.getItem("modeLog") || "[]");
  const logList = document.getElementById("modeLog");
  logList.innerHTML = modeLog.map(entry => `<li>${entry.date} — ${entry.mode}</li>`).join("");

  const history = JSON.parse(localStorage.getItem("history") || "[]");
  const histList = document.getElementById("historyList");
  histList.innerHTML = history.map(entry => `
    <li><strong>${entry.date} (${entry.mode})</strong><ul>${
      entry.entries.map(e => `<li>${e.activity}: ${e.note || "—"}</li>`).join("")
    }</ul></li>`).join("");
}

function renderStreak() {
  const log = JSON.parse(localStorage.getItem("modeLog") || "[]")
    .map(e => e.date);
  let streak = 0;
  let day = new Date();

  while (log.includes(day.toLocaleDateString())) {
    streak++;
    day.setDate(day.getDate() - 1);
  }

  const display = `<div>🔥 ${streak}-day streak</div>`;
  document.getElementById("streakDisplay").innerHTML = display;
  document.getElementById("streakInHistory").innerHTML = display;
}