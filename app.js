document.addEventListener("DOMContentLoaded", () => {
  // Splash
  const splash = document.getElementById("splashScreen");
  setTimeout(() => splash.style.display = "none", 3000);

  // Welcome Modal
  const welcomeModal = document.getElementById("welcomeModal");
  if (!localStorage.getItem("welcomeSeen")) {
    welcomeModal.classList.remove("hidden");
  }
  document.getElementById("startApp").addEventListener("click", () => {
    welcomeModal.classList.add("hidden");
    localStorage.setItem("welcomeSeen", true);
  });

  // Navigation
  const sections = ["homeView", "quickView", "historyView", "aboutView"];
  const navButtons = {
    "Home": "homeView",
    "Quick Wins": "quickView",
    "History": "historyView",
    "About": "aboutView"
  };

  Object.keys(navButtons).forEach(label => {
    document.querySelector(`button[data-view="${label}"]`).addEventListener("click", () => {
      showView(navButtons[label]);
    });
  });

  function showView(id) {
    sections.forEach(view => {
      document.getElementById(view).classList.add("hidden");
    });
    document.getElementById(id).classList.remove("hidden");
  }

  // Compass click handling
  document.querySelectorAll(".wedge").forEach(w => {
    w.addEventListener("click", () => {
      const mode = w.getAttribute("data-mode");
      loadMode(mode);
    });
  });

  // Mode button handling
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-mode");
      loadMode(mode);
    });
  });

  function loadMode(mode) {
    const view = document.getElementById("modeView");
    const title = document.getElementById("modeTitle");
    const list = document.getElementById("modeActivities");
    const config = modeData[mode];

    title.innerText = `${config.name} Mode`;
    list.innerHTML = "";

    config.activities.forEach((activity, i) => {
      const box = document.createElement("div");
      box.className = "mode-activity";
      box.innerHTML = `<strong>${activity}</strong><br/><input type="text" placeholder="What did you do?" data-mode="${mode}" data-activity="${activity}" />`;
      list.appendChild(box);
    });

    showView("modeView");
    saveLog(mode);
  }

  function saveLog(mode) {
    const today = new Date().toISOString().split("T")[0];
    const logs = JSON.parse(localStorage.getItem("logs") || "{}");

    if (!logs[today]) logs[today] = [];
    if (!logs[today].includes(mode)) logs[today].push(mode);

    localStorage.setItem("logs", JSON.stringify(logs));
    updateStreak();
    renderHistory();
  }

  function updateStreak() {
    const logs = JSON.parse(localStorage.getItem("logs") || "{}");
    const days = Object.keys(logs).sort().reverse();

    let streak = 0;
    let today = new Date();
    for (let day of days) {
      const logDate = new Date(day);
      if (today.toDateString() === logDate.toDateString()) {
        streak++;
        today.setDate(today.getDate() - 1);
      } else {
        break;
      }
    }

    document.getElementById("streakDisplay").innerText = `Daily Streak: ${streak}`;
  }

  function renderHistory() {
    const container = document.getElementById("historyContent");
    const logs = JSON.parse(localStorage.getItem("logs") || "{}");
    container.innerHTML = "";

    const entries = Object.entries(logs).sort((a, b) => b[0].localeCompare(a[0]));

    entries.forEach(([date, modes]) => {
      const div = document.createElement("div");
      div.className = "mode-activity";
      div.innerHTML = `<strong>${date}</strong><br/>${modes.join(", ")}`;
      container.appendChild(div);
    });
  }

  updateStreak();
  renderHistory();
});

// Mode definitions
const modeData = {
  "Growing": {
    name: "Growing",
    activities: [
      "Learn something new",
      "Take action on a goal",
      "Help someone today"
    ]
  },
  "Grounded": {
    name: "Grounded",
    activities: [
      "Eat a nourishing meal",
      "Stretch or move gently",
      "Reflect in a journal"
    ]
  },
  "Drifting": {
    name: "Drifting",
    activities: [
      "Pause for 5 minutes",
      "Write down your thoughts",
      "Reconnect with priorities"
    ]
  },
  "Surviving": {
    name: "Surviving",
    activities: [
      "Take 5 deep breaths",
      "Drink a glass of water",
      "Reach out for support"
    ]
  }
};