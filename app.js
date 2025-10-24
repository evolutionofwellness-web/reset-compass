document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const modal = document.getElementById("welcomeModal");
  const appContent = document.getElementById("appContent");
  const startBtn = document.getElementById("startButton");

  if (!localStorage.getItem("welcomeSeen")) {
    modal.style.display = "flex";
  } else {
    modal.style.display = "none";
    appContent.style.display = "block";
  }

  startBtn.addEventListener("click", () => {
    modal.style.display = "none";
    localStorage.setItem("welcomeSeen", "true");
    appContent.style.display = "block";
  });

  renderStreak();
  renderHistory();
  renderQuickWins();
});

function selectMode(mode) {
  const today = new Date().toISOString().split('T')[0];
  const logs = JSON.parse(localStorage.getItem("modeLogs") || "[]");
  logs.push({ date: today, mode });
  localStorage.setItem("modeLogs", JSON.stringify(logs));
  renderStreak();
  renderHistory();
  alert(`Mode selected: ${mode}`);
}

function renderStreak() {
  const logs = JSON.parse(localStorage.getItem("modeLogs") || "[]").reverse();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < logs.length; i++) {
    const date = new Date(logs[i].date);
    const diff = (today - date) / (1000 * 60 * 60 * 24);
    if (diff > i + 0.5) break;
    streak++;
  }
  document.getElementById("streakDisplay").textContent = `🔥 ${streak}-day streak`;
}

function renderHistory() {
  const logs = JSON.parse(localStorage.getItem("modeLogs") || "[]");
  const container = document.getElementById("historyLog");
  container.innerHTML = "";
  if (!logs.length) {
    container.innerHTML = "<p>No activity yet.</p>";
    return;
  }
  logs.reverse().forEach(entry => {
    const div = document.createElement("div");
    div.textContent = `${entry.date}: ${entry.mode}`;
    container.appendChild(div);
  });
}

function renderQuickWins() {
  const container = document.getElementById("quickWinList");
  container.innerHTML = `
    <ul>
      <li>Drink a glass of water</li>
      <li>Stretch for 2 minutes</li>
      <li>Step outside for fresh air</li>
      <li>Write one thing you’re grateful for</li>
    </ul>
  `;
}

function showSection(id) {
  document.querySelectorAll(".section").forEach(section => {
    section.classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}