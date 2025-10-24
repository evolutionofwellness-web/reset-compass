document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const welcomeModal = document.getElementById("welcomeModal");
  const appWrapper = document.getElementById("app");

  setTimeout(() => splash.style.display = "none", 3000);

  if (!localStorage.getItem("welcomeSeen")) {
    welcomeModal.classList.remove("hidden");
  } else {
    appWrapper.classList.remove("hidden");
  }

  document.getElementById("startApp").addEventListener("click", () => {
    welcomeModal.classList.add("hidden");
    localStorage.setItem("welcomeSeen", true);
    appWrapper.classList.remove("hidden");
  });

  // Navigation
  window.navigate = function(viewId) {
    ["homeView", "quickWinsView", "historyView", "aboutView", "modeView"].forEach(id => {
      document.getElementById(id).classList.add("hidden");
    });
    document.getElementById(viewId).classList.remove("hidden");
  };

  document.querySelectorAll("nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      if (view) navigate(view);
    });
  });

  // Wedge + Button click handlers
  document.querySelectorAll(".wedge, .mode-btn").forEach(el => {
    el.addEventListener("click", () => {
      const mode = el.getAttribute("data-mode");
      if (mode) loadMode(mode);
    });
  });

  function loadMode(mode) {
    const config = modeData[mode];
    document.getElementById("modeTitle").innerText = `${config.name} Mode`;
    const list = document.getElementById("modeActivities");
    list.innerHTML = "";

    config.activities.forEach(activity => {
      const div = document.createElement("div");
      div.className = "mode-activity";
      div.innerHTML = `<strong>${activity}</strong><br><input type="text" placeholder="What did you do?" data-mode="${mode}" data-activity="${activity}">`;
      list.appendChild(div);
    });

    saveLog(mode);
    navigate("modeView");
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

// Mode data
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