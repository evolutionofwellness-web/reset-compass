document.addEventListener("DOMContentLoaded", function () {
  // Splash screen removal
  setTimeout(() => {
    document.getElementById("splashScreen").style.display = "none";
  }, 2500);

  // Welcome popup logic
  if (!localStorage.getItem("welcomeShown")) {
    document.getElementById("welcomePopup").style.display = "block";
  }

  document.getElementById("startButton").addEventListener("click", function () {
    document.getElementById("welcomePopup").style.display = "none";
    localStorage.setItem("welcomeShown", true);
  });

  // Navigation
  document.querySelectorAll("nav button").forEach((btn) => {
    btn.addEventListener("click", function () {
      const section = this.dataset.section;
      document.querySelectorAll(".section").forEach((s) => s.style.display = "none");
      document.getElementById(section).style.display = "block";
      if (section === "history") renderHistory();
    });
  });

  // Compass click handlers
  document.getElementById("wedge-growing").addEventListener("click", () => goToMode("growing"));
  document.getElementById("wedge-grounded").addEventListener("click", () => goToMode("grounded"));
  document.getElementById("wedge-drifting").addEventListener("click", () => goToMode("drifting"));
  document.getElementById("wedge-surviving").addEventListener("click", () => goToMode("surviving"));

  // Button handlers
  document.getElementById("btn-growing").addEventListener("click", () => goToMode("growing"));
  document.getElementById("btn-grounded").addEventListener("click", () => goToMode("grounded"));
  document.getElementById("btn-drifting").addEventListener("click", () => goToMode("drifting"));
  document.getElementById("btn-surviving").addEventListener("click", () => goToMode("surviving"));

  // Save button listeners
  ["growing", "grounded", "drifting", "surviving", "quick"].forEach(mode => {
    const saveBtn = document.getElementById(`save-${mode}`);
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        const text = document.getElementById(`log-${mode}`).value.trim();
        if (text) saveLog(mode, text);
      });
    }
  });

  updateStreak();
});

// Mode navigation
function goToMode(mode) {
  document.querySelectorAll(".section").forEach((s) => s.style.display = "none");
  document.getElementById(`mode-${mode}`).style.display = "block";
}

// Save activity
function saveLog(mode, text) {
  const today = new Date().toISOString().split("T")[0];
  const entry = { mode, text, date: today };

  let logs = JSON.parse(localStorage.getItem("logs") || "[]");
  logs.push(entry);
  localStorage.setItem("logs", JSON.stringify(logs));

  updateStreak();
  alert("Saved!");
}

// Display history
function renderHistory() {
  const historyEl = document.getElementById("historyLog");
  const logs = JSON.parse(localStorage.getItem("logs") || "[]").reverse();

  historyEl.innerHTML = logs.map(log =>
    `<div><strong>${log.date}</strong> — <em>${log.mode}</em><br>${log.text}</div>`
  ).join("") || "<p>No activity logged yet.</p>";
}

// Update streak
function updateStreak() {
  const logs = JSON.parse(localStorage.getItem("logs") || "[]");
  const dates = [...new Set(logs.map(log => log.date))].sort().reverse();

  let streak = 0;
  let currentDate = new Date();

  for (let date of dates) {
    const logDate = new Date(date);
    const diff = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
      streak++;
    } else if (diff === 1 && streak > 0) {
      streak++;
    } else {
      break;
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  document.getElementById("streak").innerHTML = `<span class="emoji">🔥</span>${streak} day streak`;
}