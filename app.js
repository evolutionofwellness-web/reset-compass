document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  setTimeout(() => splash.style.display = "none", 2000);
  updateStreakDisplay();
});

function navigate(view) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById(view).classList.remove("hidden");
  if (view === 'history') renderHistory();
  if (view === 'quickwins') renderQuickWins();
}

function openMode(mode) {
  navigate('mode-view');
  const container = document.getElementById("mode-view");
  container.innerHTML = `<h2>${mode}</h2>`;
  const activities = getActivitiesForMode(mode);
  activities.forEach((act, idx) => {
    const inputId = `${mode}-${idx}`;
    container.innerHTML += `
      <label>${act}</label>
      <input type="text" id="${inputId}" />
      <button class="log-button" onclick="logActivity('${mode}', '${act}', '${inputId}')">Log</button>
    `;
  });
  container.innerHTML += `<button onclick="navigate('home')">← Back</button>`;
}

function renderQuickWins() {
  const quickWins = ["Drink water", "Do 5 squats", "Take 3 deep breaths"];
  const container = document.getElementById("quickwins");
  container.innerHTML = `<h2>Quick Wins</h2>`;
  quickWins.forEach((act, idx) => {
    const inputId = `quick-${idx}`;
    container.innerHTML += `
      <label>${act}</label>
      <input type="text" id="${inputId}" />
      <button class="log-button" onclick="logActivity('Quick Win', '${act}', '${inputId}')">Log</button>
    `;
  });
  container.innerHTML += `<button onclick="navigate('home')">← Back</button>`;
}

function logActivity(mode, activity, inputId) {
  const text = document.getElementById(inputId).value.trim();
  if (!text) return;
  const history = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  const timestamp = new Date().toISOString();
  history.push({ mode, activity, text, timestamp });
  localStorage.setItem("resetHistory", JSON.stringify(history));
  updateStreak();
  alert("Activity logged!");
  navigate('home');
}

function renderHistory() {
  const container = document.getElementById("history");
  const history = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  if (!history.length) {
    container.innerHTML = `<h2>History</h2><p>No activities logged yet.</p><button onclick="navigate('home')">← Back</button>`;
    return;
  }
  container.innerHTML = `<h2>History</h2>`;
  history.slice(-10).reverse().forEach(item => {
    const date = new Date(item.timestamp).toLocaleString();
    container.innerHTML += `<p><strong>${item.mode}:</strong> ${item.activity} – "${item.text}" <em>(${date})</em></p>`;
  });
  container.innerHTML += `<button onclick="navigate('home')">← Back</button>`;
}

function updateStreak() {
  const today = new Date().toISOString().split("T")[0];
  let streakData = JSON.parse(localStorage.getItem("streakData") || "{}");
  if (streakData.lastDate !== today) {
    streakData.count = (streakData.count || 0) + 1;
    streakData.lastDate = today;
    localStorage.setItem("streakData", JSON.stringify(streakData));
  }
  updateStreakDisplay();
}

function updateStreakDisplay() {
  const data = JSON.parse(localStorage.getItem("streakData") || "{}");
  document.getElementById("streak-display").innerText = `Daily Streak: ${data.count || 0} 🔥`;
}

function getActivitiesForMode(mode) {
  const activities = {
    "Growing": ["Write a goal", "Tackle a challenge", "Start a new project"],
    "Grounded": ["Organize your space", "Create a checklist", "Do a focused task"],
    "Drifting": ["Stretch for 1 minute", "Walk around the block", "Journal your thoughts"],
    "Surviving": ["Eat something nourishing", "Take a break", "Message a friend"]
  };
  return activities[mode] || [];
}