// Splash screen
window.addEventListener("load", () => {
  const splash = document.getElementById("splashScreen");
  setTimeout(() => {
    splash.style.display = "none";
    document.getElementById("welcomeModal").classList.remove("hidden");
  }, 2000);
});

// Start button
document.getElementById("startApp").addEventListener("click", () => {
  document.getElementById("welcomeModal").classList.add("hidden");
  document.getElementById("appWrapper").classList.remove("hidden");
  renderStreak();
});

// Navigation
function navigate(viewId) {
  document.querySelectorAll("main section").forEach(section => {
    section.classList.add("hidden");
  });
  document.getElementById(viewId).classList.remove("hidden");

  if (viewId === "historyView") {
    renderHistory();
  }
}

// Mode selection (wedge or button)
document.querySelectorAll(".wedge, .mode-button").forEach(el => {
  el.addEventListener("click", () => {
    const selectedMode = el.dataset.mode;
    logMode(selectedMode);
    alert(`You selected: ${selectedMode}`);
  });
});

// Mode log
function logMode(mode) {
  const today = new Date().toISOString().split("T")[0];
  let history = JSON.parse(localStorage.getItem("modeHistory")) || [];

  // Prevent duplicate mode logs on same day
  const alreadyLogged = history.some(entry => entry.date === today);
  if (!alreadyLogged) {
    history.push({ date: today, mode });
    localStorage.setItem("modeHistory", JSON.stringify(history));
  }

  renderStreak();
}

// Render streak and breakdown
function renderStreak() {
  const history = JSON.parse(localStorage.getItem("modeHistory")) || [];
  if (history.length === 0) {
    document.querySelector(".streak-display").textContent = "🔥 0-Day Streak";
    return;
  }

  let streak = 1;
  const today = new Date();
  for (let i = history.length - 2; i >= 0; i--) {
    const current = new Date(history[i].date);
    const next = new Date(history[i + 1].date);
    const diff = (next - current) / (1000 * 60 * 60 * 24);
    if (diff === 1) streak++;
    else break;
  }

  document.querySelector(".streak-display").textContent = `🔥 ${streak}-Day Streak`;
}

// Render history and mode breakdown
function renderHistory() {
  const container = document.getElementById("historyContainer");
  const breakdown = document.getElementById("modeBreakdown");
  const history = JSON.parse(localStorage.getItem("modeHistory")) || [];

  container.innerHTML = "";
  if (history.length === 0) {
    container.textContent = "No mode history yet.";
    breakdown.textContent = "";
    return;
  }

  history.slice().reverse().forEach(entry => {
    const div = document.createElement("div");
    div.textContent = `${entry.date}: ${entry.mode}`;
    container.appendChild(div);
  });

  const counts = history.reduce((acc, entry) => {
    acc[entry.mode] = (acc[entry.mode] || 0) + 1;
    return acc;
  }, {});
  const total = history.length;
  const summary = Object.entries(counts)
    .map(([mode, count]) => `${mode}: ${Math.round((count / total) * 100)}%`)
    .join(" | ");
  breakdown.textContent = `Mode Breakdown: ${summary}`;
}