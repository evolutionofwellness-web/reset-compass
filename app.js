document.addEventListener("DOMContentLoaded", () => {
  // Splash Screen
  const splash = document.getElementById("splashScreen");
  setTimeout(() => {
    splash.style.display = "none";
    maybeShowWelcome();
  }, 2800);

  function maybeShowWelcome() {
    const seen = localStorage.getItem("welcomeSeen");
    if (!seen) {
      document.getElementById("welcomeModal").classList.remove("hidden");
    } else {
      document.getElementById("app").classList.remove("hidden");
    }
  }

  document.getElementById("startApp").addEventListener("click", () => {
    document.getElementById("welcomeModal").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    localStorage.setItem("welcomeSeen", "true");
  });

  // Navigation
  const sections = ["homeView", "quickWinsView", "historyView", "aboutView", "modeView"];
  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-view");
      showView(target);
    });
  });

  function showView(id) {
    sections.forEach(view => {
      document.getElementById(view).classList.add("hidden");
    });
    document.getElementById(id).classList.remove("hidden");
  }

  // Mode Click Handling
  const allModeButtons = document.querySelectorAll(".mode-button, .wedge");
  allModeButtons.forEach(el => {
    el.addEventListener("click", () => {
      const mode = el.getAttribute("data-mode");
      loadMode(mode);
    });
  });

  function loadMode(mode) {
    const modeView = document.getElementById("modeView");
    const title = document.getElementById("modeTitle");
    const container = document.getElementById("modeActivities");
    const config = modeData[mode];

    title.innerText = `${config.name} Mode`;
    container.innerHTML = "";

    config.activities.forEach(activity => {
      const div = document.createElement("div");
      div.className = "mode-activity";
      div.innerHTML = `
        <strong>${activity}</strong><br/>
        <input type="text" placeholder="What did you do?" data-mode="${mode}" data-activity="${activity}" />
      `;
      container.appendChild(div);
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
    const dates = Object.keys(logs).sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    let day = new Date();

    for (let i = 0; i < dates.length; i++) {
      const logDate = new Date(dates[i]);
      if (logDate.toDateString() === day.toDateString()) {
        streak++;
        day.setDate(day.getDate() - 1);
      } else {
        break;
      }
    }

    document.getElementById("streakDisplay").innerText = `🔥 Daily Streak: ${streak}`;
  }

  function renderHistory() {
    const container = document.getElementById("historyContent");
    const logs = JSON.parse(localStorage.getItem("logs") || "{}");

    container.innerHTML = "";

    const sorted = Object.entries(logs).sort((a, b) => b[0].localeCompare(a[0]));
    sorted.forEach(([date, modes]) => {
      const div = document.createElement("div");
      div.className = "mode-activity";
      div.innerHTML = `<strong>${date}</strong><br/>${modes.join(", ")}`;
      container.appendChild(div);
    });
  }

  updateStreak();
  renderHistory();
});

// Mode Data
const modeData = {
  Growing: {
    name: "Growing",
    activities: [
      "Learn something new",
      "Take action on a goal",
      "Help someone today"
    ]
  },
  Grounded: {
    name: "Grounded",
    activities: [
      "Eat a nourishing meal",
      "Stretch or move gently",
      "Reflect in a journal"
    ]
  },
  Drifting: {
    name: "Drifting",
    activities: [
      "Pause for 5 minutes",
      "Write down your thoughts",
      "Reconnect with priorities"
    ]
  },
  Surviving: {
    name: "Surviving",
    activities: [
      "Take 5 deep breaths",
      "Drink a glass of water",
      "Reach out for support"
    ]
  }
};