// Splash screen
window.addEventListener("load", () => {
  const splash = document.getElementById("splashScreen");
  setTimeout(() => {
    splash.style.display = "none";
    showWelcomePopupOnce();
  }, 2000);
});

// Welcome popup
function showWelcomePopupOnce() {
  if (!localStorage.getItem("welcomeShown")) {
    document.getElementById("welcomePopup").style.display = "block";
    document.getElementById("startButton").addEventListener("click", () => {
      document.getElementById("welcomePopup").style.display = "none";
      localStorage.setItem("welcomeShown", "true");
    });
  }
}

// Navigation
function navigateTo(sectionId) {
  document.querySelectorAll(".section").forEach((section) => {
    section.style.display = "none";
  });
  const target = document.getElementById(`${sectionId}Section`);
  if (target) {
    target.style.display = "block";
  }
}

// Mode Selection
const activities = {
  growing: [
    "Identify one thing you're proud of this week.",
    "Journal about your long-term goals.",
    "Try something that challenges you today."
  ],
  drifting: [
    "Check in with a friend you haven’t talked to in a while.",
    "Reflect on how your day is going.",
    "Take 5 minutes to reset your environment."
  ],
  grounded: [
    "Take a mindful walk or break.",
    "Write down 3 things you're grateful for.",
    "Set a small intention for the rest of your day."
  ],
  surviving: [
    "Drink water and eat something nourishing.",
    "Give yourself permission to rest.",
    "Take 3 deep breaths right now."
  ]
};

function selectMode(mode) {
  document.getElementById("modeTitle").innerText = `You're in ${capitalize(mode)} Mode`;
  const listContainer = document.getElementById("activityList");
  listContainer.innerHTML = "";

  activities[mode].forEach((text, i) => {
    const item = document.createElement("div");
    item.className = "activity-item";

    const label = document.createElement("label");
    label.innerText = text;

    const input = document.createElement("textarea");
    input.placeholder = "What did you do?";
    input.id = `response-${mode}-${i}`;

    const saveBtn = document.createElement("button");
    saveBtn.innerText = "Save";
    saveBtn.onclick = () => {
      const log = input.value.trim();
      if (log !== "") {
        saveToHistory(mode, text, log);
        input.value = "";
        alert("Saved!");
      }
    };

    item.appendChild(label);
    item.appendChild(input);
    item.appendChild(saveBtn);
    listContainer.appendChild(item);
  });

  navigateTo("mode");
}

// Save logs
function saveToHistory(mode, activity, userEntry) {
  const history = JSON.parse(localStorage.getItem("resetHistory") || "[]");
  const timestamp = new Date().toLocaleString();
  history.unshift({ mode, activity, userEntry, timestamp });
  localStorage.setItem("resetHistory", JSON.stringify(history));
  updateHistory();
  updateStreak(mode);
}

// History view
function updateHistory() {
  const container = document.getElementById("mode-history");
  container.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("resetHistory") || "[]");

  history.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "history-entry";
    div.innerHTML = `
      <strong>${entry.mode.toUpperCase()}</strong> - ${entry.timestamp}<br/>
      <em>${entry.activity}</em><br/>
      You did: ${entry.userEntry}
    `;
    container.appendChild(div);
  });

  updateBreakdown(history);
}

// Streak tracking
function updateStreak(currentMode) {
  const today = new Date().toLocaleDateString();
  const storedDate = localStorage.getItem("lastEntryDate");
  if (storedDate !== today) {
    let streak = parseInt(localStorage.getItem("streakCount") || "0");
    streak += 1;
    localStorage.setItem("streakCount", streak.toString());
    localStorage.setItem("lastEntryDate", today);
  }
  document.getElementById("streakCount").innerText = localStorage.getItem("streakCount") || "0";
}

// Mode breakdown
function updateBreakdown(history) {
  const breakdown = {};
  history.forEach((entry) => {
    breakdown[entry.mode] = (breakdown[entry.mode] || 0) + 1;
  });

  const total = history.length;
  const list = document.getElementById("modeBreakdownList");
  list.innerHTML = "";

  Object.entries(breakdown).forEach(([mode, count]) => {
    const li = document.createElement("li");
    const percent = ((count / total) * 100).toFixed(1);
    li.innerText = `${capitalize(mode)}: ${percent}%`;
    list.appendChild(li);
  });
}

// Utility
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize history and streak count on load
window.addEventListener("DOMContentLoaded", () => {
  updateHistory();
  document.getElementById("streakCount").innerText = localStorage.getItem("streakCount") || "0";
});
