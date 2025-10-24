document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash");
  const app = document.getElementById("appContent");
  const modal = document.getElementById("welcomeModal");

  setTimeout(() => {
    splash.style.display = "none";
    if (!localStorage.getItem("visited")) {
      modal.style.display = "flex";
    } else {
      app.style.display = "block";
    }
  }, 1200);

  document.getElementById("startBtn").onclick = () => {
    modal.style.display = "none";
    localStorage.setItem("visited", "true");
    app.style.display = "block";
  };

  updateStreakDisplay();
  showHistory();
});

let modeLog = JSON.parse(localStorage.getItem("modeLog") || "[]");

function selectMode(mode) {
  const today = new Date().toISOString().split("T")[0];
  if (!modeLog.find(entry => entry.date === today)) {
    modeLog.push({ date: today, mode });
    localStorage.setItem("modeLog", JSON.stringify(modeLog));
  }
  updateStreakDisplay();
  renderModeView(mode);
}

function renderModeView(mode) {
  navigate('modeView');
  document.getElementById("modeView").innerHTML = `
    <h2>${mode} Mode</h2>
    <ul>
      <li>${mode === 'Surviving' ? 'Drink water' : mode === 'Drifting' ? 'Take 5 slow breaths' : mode === 'Grounded' ? 'Move your body' : 'Do something bold'}</li>
    </ul>
  `;
}

function updateStreakDisplay() {
  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  let date = new Date();
  while (modeLog.find(e => e.date === date.toISOString().split("T")[0])) {
    streak++;
    date.setDate(date.getDate() - 1);
  }
  document.getElementById("mode-streak").innerHTML = `🔥 ${streak}-day streak`;
  document.getElementById("mode-streak-history").innerHTML = `🔥 ${streak}-day streak`;
}

function showHistory() {
  const breakdown = { Surviving: 0, Drifting: 0, Grounded: 0, Growing: 0 };
  modeLog.forEach(e => breakdown[e.mode]++);
  const total = modeLog.length;
  const summary = Object.entries(breakdown).map(([mode, count]) =>
    `<div>${mode}: ${((count / total) * 100).toFixed(1)}%</div>`
  ).join('');
  document.getElementById("mode-breakdown").innerHTML = summary;
  document.getElementById("mode-history").innerHTML = modeLog.map(e =>
    `<div>${e.date} - ${e.mode}</div>`
  ).join('');
}

function navigate(id) {
  document.querySelectorAll("main section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
}