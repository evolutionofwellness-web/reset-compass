document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  setTimeout(() => splash.style.display = "none", 2200);

  const welcomeModal = document.getElementById("welcomeModal");
  const appWrapper = document.getElementById("appContent");

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
    ["homeView", "quickWinsView", "historyView", "aboutView"].forEach(id => {
      document.getElementById(id).classList.add("hidden");
    });
    document.getElementById(viewId).classList.remove("hidden");
  };

  // Wedge + Button click handlers
  document.querySelectorAll(".wedge, .mode-btn").forEach(el => {
    el.addEventListener("click", () => {
      const mode = el.getAttribute("data-mode");
      if (mode) loadMode(mode);
    });
  });

  function loadMode(mode) {
    const title = document.getElementById("modeTitle");
    const list = document.getElementById("modeActivities");
    title.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);

    const activities = {
      surviving: ["Drink a glass of water", "Step outside for 2 minutes", "Put your phone down"],
      drifting: ["Write down one thought", "Stretch your back and shoulders", "Choose a small win"],
      grounded: ["Take a 10-min walk", "Prep something healthy", "Reflect on a goal"],
      growing: ["Strive toward your goal", "Learn one new thing", "Help someone else"]
    };

    list.innerHTML = "";

    activities[mode].forEach((activity, i) => {
      const div = document.createElement("div");
      div.className = "mode-activity";
      div.innerHTML = `
        <strong>${activity}</strong>
        <input type="text" placeholder="What did you do?" data-mode="${mode}" data-index="${i}">
      `;
      list.appendChild(div);
    });

    document.getElementById("saveActivities").onclick = () => {
      const inputs = list.querySelectorAll("input");
      const today = new Date().toLocaleDateString();
      const logs = JSON.parse(localStorage.getItem("logs") || "[]");
      let updated = false;

      inputs.forEach(input => {
        const note = input.value.trim();
        const activityMode = input.dataset.mode;
        if (note) {
          logs.push({ date: today, note, mode: activityMode });
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem("logs", JSON.stringify(logs));
        updateHistory();
        updateStreak(today);
        updateModeBreakdown();
        navigate("historyView");
      }
    };

    navigate("modeView");
  }

  function updateHistory() {
    const container = document.getElementById("logEntries");
    const logs = JSON.parse(localStorage.getItem("logs") || "[]");
    container.innerHTML = "";

    logs.slice().reverse().forEach(entry => {
      const div = document.createElement("div");
      div.className = `log-entry ${entry.mode}`;
      div.textContent = `[${entry.date}] ${entry.mode.toUpperCase()}: ${entry.note}`;
      container.appendChild(div);
    });
  }

  function updateStreak(today) {
    const logs = JSON.parse(localStorage.getItem("logs") || "[]");
    const dates = [...new Set(logs.map(l => l.date))];
    let streak = 0;
    let current = new Date(today);

    while (dates.includes(current.toLocaleDateString())) {
      streak++;
      current.setDate(current.getDate() - 1);
    }

    localStorage.setItem("streak", streak);
    document.getElementById("streakDisplay").textContent = `🔥 ${streak}-Day Streak`;
  }

  function updateModeBreakdown() {
    const logs = JSON.parse(localStorage.getItem("logs") || "[]");
    const total = logs.length;
    const count = { surviving: 0, drifting: 0, grounded: 0, growing: 0 };

    logs.forEach(log => count[log.mode]++);

    const breakdown = Object.entries(count)
      .map(([mode, n]) => `${mode.charAt(0).toUpperCase() + mode.slice(1)}: ${((n / total) * 100 || 0).toFixed(1)}%`)
      .join(" • ");

    document.getElementById("modeBreakdown").textContent = `Your activity breakdown: ${breakdown}`;
  }

  // Load initial data
  updateHistory();
  updateModeBreakdown();
  const today = new Date().toLocaleDateString();
  updateStreak(today);
});