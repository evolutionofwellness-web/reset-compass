document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const popup = document.getElementById("welcomePopup");
  const app = document.getElementById("appContent");
  const startBtn = document.getElementById("startButton");

  // Splash animation
  setTimeout(() => {
    splash.style.display = "none";

    // Show popup only once
    if (!localStorage.getItem("popupShown")) {
      popup.style.display = "flex";
    } else {
      app.style.display = "block";
    }
  }, 1800);

  startBtn.addEventListener("click", () => {
    popup.style.display = "none";
    app.style.display = "block";
    localStorage.setItem("popupShown", "true");
  });

  // Navigation
  window.navigateTo = (section) => {
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    document.getElementById(`${section}Section`)?.classList.add("active");
    if (section === "quickWins") renderQuickWins();
    if (section === "history") renderHistory();
  };

  // Mode logic
  const modeActivities = {
    Growing: [
      "Do something that scares you",
      "Plan your next 3 steps",
      "Celebrate progress"
    ],
    Drifting: [
      "Name what’s distracting you",
      "Write 1 sentence to refocus",
      "Stand up and reset"
    ],
    Surviving: [
      "Breathe deeply for 1 minute",
      "Drink some water",
      "Choose the next small step"
    ],
    Grounded: [
      "Take a mindful walk",
      "Listen to calming music",
      "Limit screen time for 30 minutes"
    ]
  };

  window.enterMode = (mode) => {
    const title = document.getElementById("modeTitle");
    const list = document.getElementById("activityList");
    const section = document.getElementById("modeSection");

    title.textContent = `${mode} Mode`;
    list.innerHTML = "";
    modeActivities[mode].forEach((activity, i) => {
      const li = document.createElement("li");
      li.textContent = activity;

      const textarea = document.createElement("textarea");
      textarea.placeholder = "Write what you did...";
      textarea.rows = 3;
      textarea.id = `${mode}_note_${i}`;

      li.appendChild(textarea);
      list.appendChild(li);
    });

    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    section.classList.add("active");

    // Save current mode for logging
    localStorage.setItem("activeMode", mode);
  };

  window.saveActivity = () => {
    const mode = localStorage.getItem("activeMode");
    const notes = [];
    modeActivities[mode].forEach((_, i) => {
      const input = document.getElementById(`${mode}_note_${i}`);
      if (input) notes.push(input.value);
    });

    const log = {
      mode,
      timestamp: new Date().toISOString(),
      notes
    };

    const logs = JSON.parse(localStorage.getItem("logs") || "[]");
    logs.push(log);
    localStorage.setItem("logs", JSON.stringify(logs));

    updateStreak(logs);
    alert("Saved!");
  };

  function updateStreak(logs) {
    const today = new Date().toISOString().slice(0, 10);
    const dates = [...new Set(logs.map(log => log.timestamp.slice(0, 10)))];
    dates.sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let current = new Date(today);

    for (let date of dates) {
      if (date === current.toISOString().slice(0, 10)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    document.getElementById("streakCount").textContent = streak;
  }

  function renderHistory() {
    const logs = JSON.parse(localStorage.getItem("logs") || "[]");
    const modeHistory = document.getElementById("modeHistory");
    const modeBreakdown = document.getElementById("modeBreakdown");

    const counts = {};
    modeHistory.innerHTML = "";
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleString();
      const entry = document.createElement("div");
      entry.innerHTML = `<strong>${log.mode}</strong> — ${date}<br>${log.notes.join("<br>")}`;
      modeHistory.appendChild(entry);

      counts[log.mode] = (counts[log.mode] || 0) + 1;
    });

    modeBreakdown.innerHTML = `<p><strong>Entries by Mode:</strong></p>`;
    for (let mode in counts) {
      modeBreakdown.innerHTML += `<p>${mode}: ${counts[mode]}</p>`;
    }

    updateStreak(logs);
  }

  // QUICK WINS
  const quickWins = [
    "Take 3 deep breaths",
    "Stretch for 1 minute",
    "Drink a full glass of water"
  ];

  function renderQuickWins() {
    const container = document.getElementById("quickWins");
    container.innerHTML = `<h2>Quick Wins</h2><ul id="quickList"></ul>`;
    const ul = document.getElementById("quickList");

    quickWins.forEach((win, i) => {
      const li = document.createElement("li");
      li.textContent = win;

      const textarea = document.createElement("textarea");
      textarea.placeholder = "Write what you did...";
      textarea.rows = 2;
      textarea.id = `quick_${i}`;

      li.appendChild(textarea);
      ul.appendChild(li);
    });

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.onclick = saveQuickWin;
    saveBtn.className = "save-btn";
    container.appendChild(saveBtn);
  }

  window.saveQuickWin = () => {
    const notes = quickWins.map((_, i) => {
      const input = document.getElementById(`quick_${i}`);
      return input ? input.value : "";
    });

    const log = {
      mode: "Quick Wins",
      timestamp: new Date().toISOString(),
      notes
    };

    const logs = JSON.parse(localStorage.getItem("logs") || "[]");
    logs.push(log);
    localStorage.setItem("logs", JSON.stringify(logs));

    updateStreak(logs);
    alert("Quick Wins saved!");
  };

  // Compass wedges click
  document.querySelectorAll("#compass path").forEach(path => {
    path.addEventListener("click", () => {
      const mode = path.getAttribute("data-mode");
      if (mode) enterMode(mode);
    });
  });
});