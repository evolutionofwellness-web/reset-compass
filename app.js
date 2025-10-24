document.addEventListener("DOMContentLoaded", function () {
  const splash = document.getElementById("splashScreen");
  if (splash) {
    setTimeout(() => {
      splash.style.display = "none";
      document.getElementById("appContent").style.display = "block";
    }, 1200);
  }

  const modal = document.getElementById("welcomeModal");
  if (localStorage.getItem("visitedBefore") !== "true") {
    modal.classList.remove("hidden");
    localStorage.setItem("visitedBefore", "true");
  }

  document.getElementById("closeModal").addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  const navLinks = document.querySelectorAll("nav button");
  const sections = document.querySelectorAll("main > section");
  const homeSection = document.getElementById("home");

  navLinks.forEach((button) => {
    button.addEventListener("click", () => {
      const sectionId = button.getAttribute("data-section");
      sections.forEach((section) => {
        section.classList.add("hidden");
      });
      document.getElementById(sectionId).classList.remove("hidden");
    });
  });

  const modeButtons = document.querySelectorAll(".mode-button");
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedMode = button.getAttribute("data-mode");
      renderModePage(selectedMode);
      logMode(selectedMode);
      updateStreak();
      updateHistoryDisplay();
    });
  });

  const wedges = document.querySelectorAll(".wedge");
  wedges.forEach((wedge) => {
    wedge.addEventListener("click", () => {
      const mode = wedge.getAttribute("data-mode");
      renderModePage(mode);
      logMode(mode);
      updateStreak();
      updateHistoryDisplay();
    });
  });

  function renderModePage(mode) {
    document.querySelectorAll("main > section").forEach((section) => section.classList.add("hidden"));
    const section = document.getElementById("modeView");
    section.classList.remove("hidden");

    const title = document.getElementById("modeTitle");
    const container = document.getElementById("modeActivities");
    container.innerHTML = "";

    const activities = getModeActivities(mode);
    title.textContent = mode;

    activities.forEach((activity, index) => {
      const div = document.createElement("div");
      div.className = "activity";
      div.innerHTML = `<strong>${activity}</strong><br><textarea placeholder="What did you do?" data-mode="${mode}" data-activity="${index}"></textarea>`;
      container.appendChild(div);
    });
  }

  function getModeActivities(mode) {
    const activitiesByMode = {
      Growing: [
        "Did something that pushed you out of your comfort zone",
        "Learned a new skill or concept",
        "Took meaningful action toward a long-term goal",
      ],
      Grounded: [
        "Completed a routine habit (exercise, meal prep, etc.)",
        "Took care of a responsibility",
        "Stayed off autopilot and moved with intention",
      ],
      Drifting: [
        "Felt distracted or unmotivated",
        "Wasted time or procrastinated",
        "Let the day happen to you without structure",
      ],
      Surviving: [
        "Felt overwhelmed, sick, or burnt out",
        "Couldn’t focus on anything beyond the next task",
        "Did the bare minimum to get by",
      ],
    };
    return activitiesByMode[mode] || [];
  }

  function logMode(mode) {
    const logs = JSON.parse(localStorage.getItem("modeLogs") || "[]");
    const today = new Date().toLocaleDateString();
    const existing = logs.find((log) => log.date === today);
    if (!existing) {
      logs.push({ date: today, mode });
      localStorage.setItem("modeLogs", JSON.stringify(logs));
    }
  }

  function updateStreak() {
    const logs = JSON.parse(localStorage.getItem("modeLogs") || "[]");
    const sorted = logs.map((log) => log.date).sort();
    let streak = 0;
    let current = new Date();

    for (let i = sorted.length - 1; i >= 0; i--) {
      const logDate = new Date(sorted[i]);
      if (
        logDate.toDateString() === current.toDateString()
      ) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    const streakBanner = document.getElementById("streakBanner");
    streakBanner.innerHTML = `🔥 ${streak}-day streak`;
  }

  function updateHistoryDisplay() {
    const logs = JSON.parse(localStorage.getItem("modeLogs") || "[]");
    const historyLog = document.getElementById("historyLog");
    historyLog.innerHTML = "<h3>Your Daily Mode Log</h3>";

    logs.forEach((log) => {
      const p = document.createElement("p");
      p.textContent = `${log.date}: ${log.mode}`;
      historyLog.appendChild(p);
    });

    // Calculate breakdown
    const counts = {};
    logs.forEach((log) => {
      counts[log.mode] = (counts[log.mode] || 0) + 1;
    });
    const total = logs.length;
    const breakdown = Object.entries(counts)
      .map(([mode, count]) => `${mode}: ${Math.round((count / total) * 100)}%`)
      .join(" | ");
    document.getElementById("modeBreakdown").textContent = breakdown;
  }

  function renderQuickWins() {
    const quickWins = [
      "Took 5 deep breaths",
      "Stretched for 30 seconds",
      "Drank a full glass of water",
      "Stepped outside or opened a window",
      "Did 10 seconds of light movement",
    ];
    const container = document.getElementById("quickWinsContainer");
    container.innerHTML = "";
    quickWins.forEach((win, index) => {
      const div = document.createElement("div");
      div.className = "activity";
      div.innerHTML = `<strong>${win}</strong><br><textarea placeholder="What did you do?" data-mode="QuickWin" data-activity="${index}"></textarea>`;
      container.appendChild(div);
    });
  }

  renderQuickWins();
  updateStreak();
  updateHistoryDisplay();
});