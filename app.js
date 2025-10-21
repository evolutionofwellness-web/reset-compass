// Splash + Welcome
window.onload = function () {
  if (!localStorage.getItem("welcomeShown")) {
    document.getElementById("popup").style.display = "block";
    localStorage.setItem("welcomeShown", "true");
  }
  setTimeout(() => {
    document.getElementById("splashScreen").style.display = "none";
    showPage("home");
  }, 2100);
};

// Dismiss popup
function dismissPopup() {
  document.getElementById("popup").style.display = "none";
}

// Routing
function showPage(pageId) {
  const pages = document.querySelectorAll(".page");
  pages.forEach(page => page.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");

  // On mode pages, render activities
  if (["growing", "drifting", "surviving", "grounded"].includes(pageId)) {
    renderModeActivities(pageId);
  }
  if (pageId === "history") {
    renderHistory();
  }
}

// Activities per mode
const activities = {
  growing: ["Do something creative", "Reach out to a mentor", "Reflect on a recent win"],
  drifting: ["Take a short walk", "Listen to music you love", "Pause for 3 deep breaths"],
  surviving: ["Drink water", "Eat something nourishing", "Say no to one extra task"],
  grounded: ["Stretch your body", "Write a gratitude note", "Do 1 thing you've been avoiding"]
};

// Render activities on mode page
function renderModeActivities(mode) {
  const container = document.getElementById(`${mode}-activities`);
  container.innerHTML = ""; // Clear existing

  activities[mode].forEach((activity, index) => {
    const div = document.createElement("div");
    div.style.marginBottom = "16px";

    const label = document.createElement("p");
    label.textContent = activity;
    label.style.marginBottom = "6px";
    label.style.fontWeight = "bold";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "What did you do?";
    input.style.width = "90%";
    input.style.padding = "8px";
    input.style.marginBottom = "6px";
    input.id = `${mode}-input-${index}`;

    const btn = document.createElement("button");
    btn.textContent = "Save";
    btn.style.padding = "6px 12px";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.style.backgroundColor = "#0B3D2E";
    btn.style.color = "white";
    btn.style.cursor = "pointer";

    btn.onclick = function () {
      const entry = {
        mode,
        activity,
        note: input.value.trim(),
        timestamp: new Date().toLocaleString()
      };
      saveToHistory(entry);
      input.value = "";
      alert("Activity saved!");
    };

    div.appendChild(label);
    div.appendChild(input);
    div.appendChild(btn);
    container.appendChild(div);
  });

  // Log the mode entry (for streak/breakdown)
  const today = new Date().toISOString().split("T")[0];
  let log = JSON.parse(localStorage.getItem("modeLog")) || [];
  if (!log.find(entry => entry.date === today)) {
    log.push({ date: today, mode });
    localStorage.setItem("modeLog", JSON.stringify(log));
  }
}

// Save activity to history
function saveToHistory(entry) {
  const data = JSON.parse(localStorage.getItem("activityHistory")) || [];
  data.push(entry);
  localStorage.setItem("activityHistory", JSON.stringify(data));
}

// Render history page
function renderHistory() {
  const container = document.getElementById("historyList");
  container.innerHTML = "";
  const history = JSON.parse(localStorage.getItem("activityHistory")) || [];

  if (history.length === 0) {
    container.innerHTML = "<p>No entries yet.</p>";
    return;
  }

  history.slice().reverse().forEach(entry => {
    const item = document.createElement("li");
    item.textContent = `[${entry.timestamp}] ${entry.mode.toUpperCase()}: ${entry.activity}` +
      (entry.note ? ` — "${entry.note}"` : "");
    container.appendChild(item);
  });

  renderStreak();
  renderBreakdown();
}

// Streak logic
function renderStreak() {
  const container = document.getElementById("modeStreak");
  const log = JSON.parse(localStorage.getItem("modeLog")) || [];
  const dates = log.map(e => e.date).sort().reverse();

  let streak = 0;
  let current = new Date();

  for (let date of dates) {
    const logDate = new Date(date);
    if (logDate.toDateString() === current.toDateString()) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  container.textContent = `🔥 Streak: ${streak} day${streak !== 1 ? "s" : ""}`;
}

// Breakdown logic
function renderBreakdown() {
  const container = document.getElementById("modeBreakdown");
  const log = JSON.parse(localStorage.getItem("modeLog")) || [];
  if (log.length === 0) {
    container.textContent = "";
    return;
  }

  const counts = {};
  log.forEach(e => {
    counts[e.mode] = (counts[e.mode] || 0) + 1;
  });

  const total = log.length;
  const result = Object.entries(counts)
    .map(([mode, count]) => `${mode}: ${(count / total * 100).toFixed(0)}%`)
    .join(" | ");

  container.textContent = `Mode breakdown: ${result}`;
}