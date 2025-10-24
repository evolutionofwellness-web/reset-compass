document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const welcomeModal = document.getElementById("welcomeModal");
  const startAppBtn = document.getElementById("startApp");
  const appWrapper = document.getElementById("appWrapper");
  const appContent = document.getElementById("appContent");

  const views = {
    homeView: document.getElementById("homeView"),
    quickWinsView: document.getElementById("quickWinsView"),
    historyView: document.getElementById("historyView"),
    aboutView: document.getElementById("aboutView"),
  };

  function hideAllViews() {
    Object.values(views).forEach(view => view.classList.add("hidden"));
  }

  function navigate(viewId) {
    hideAllViews();
    views[viewId].classList.remove("hidden");
  }

  function getTodayKey() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  function getLogs() {
    return JSON.parse(localStorage.getItem("resetLogs") || "[]");
  }

  function saveLogs(logs) {
    localStorage.setItem("resetLogs", JSON.stringify(logs));
  }

  function logActivity(mode, activity, note) {
    const logs = getLogs();
    const timestamp = new Date().toISOString();
    logs.push({ timestamp, mode, activity, note });
    saveLogs(logs);
    logStreak();
  }

  function logStreak() {
    const key = "lastLoggedDay";
    const today = getTodayKey();
    const last = localStorage.getItem(key);
    if (last !== today) {
      localStorage.setItem(key, today);
      let streak = parseInt(localStorage.getItem("streak") || "0", 10);
      localStorage.setItem("streak", (streak + 1).toString());
      updateStreakDisplay();
    }
  }

  function updateStreakDisplay() {
    const streakDisplay = document.getElementById("streakDisplay");
    const streak = parseInt(localStorage.getItem("streak") || "0", 10);
    streakDisplay.textContent = `🔥 Daily Streak: ${streak}`;
  }

  function renderHome() {
    updateStreakDisplay();
    navigate("homeView");
  }

  function renderModePage(mode) {
    hideAllViews();
    const section = document.createElement("section");
    section.innerHTML = `<h2 class="mode-title">${mode} Mode</h2>`;
    const activities = getModeActivities(mode);
    activities.forEach((activity, i) => {
      const div = document.createElement("div");
      div.className = "mode-activity";
      div.innerHTML = `
        <p>${activity}</p>
        <input type="text" id="${mode}-${i}" placeholder="What did you do?">
        <button onclick="saveActivity('${mode}', '${activity}', '${mode}-${i}')">Save</button>
      `;
      section.appendChild(div);
    });
    appContent.innerHTML = "";
    appContent.appendChild(section);
  }

  window.saveActivity = (mode, activity, inputId) => {
    const note = document.getElementById(inputId).value;
    logActivity(mode, activity, note);
    alert("Saved!");
  };

  function getModeActivities(mode) {
    switch (mode) {
      case "Growing": return ["Read something meaningful", "Set a new goal", "Journal about growth"];
      case "Grounded": return ["Take a walk", "Do breathwork", "Stretch for 5 minutes"];
      case "Drifting": return ["Clear a small task", "Limit distractions", "Set a timer"];
      case "Surviving": return ["Drink water", "Take 3 deep breaths", "Text someone for support"];
      default: return [];
    }
  }

  function renderQuickWins() {
    hideAllViews();
    const section = views.quickWinsView;
    section.innerHTML = "<h2>Quick Wins</h2><p>Fast actions you can take any time.</p>";
    const wins = [
      "Stand up and stretch",
      "Drink a full glass of water",
      "Write down 1 thing you're grateful for"
    ];
    wins.forEach((win, i) => {
      const div = document.createElement("div");
      div.className = "mode-activity";
      div.innerHTML = `
        <p>${win}</p>
        <input type="text" id="win-${i}" placeholder="What did you do?">
        <button onclick="saveActivity('QuickWin', '${win}', 'win-${i}')">Save</button>
      `;
      section.appendChild(div);
    });
    section.classList.remove("hidden");
  }

  function renderHistory() {
    hideAllViews();
    const section = views.historyView;
    const logs = getLogs();
    section.innerHTML = "<h2>History</h2>";
    if (logs.length === 0) {
      section.innerHTML += "<p>No activity yet.</p>";
    } else {
      logs.reverse().forEach(log => {
        const div = document.createElement("div");
        div.className = "mode-activity";
        div.innerHTML = `
          <strong>${log.mode}</strong> | ${new Date(log.timestamp).toLocaleString()}<br/>
          <em>${log.activity}</em><br/>
          Note: ${log.note}
        `;
        section.appendChild(div);
      });
    }
  }

  function renderAbout() {
    navigate("aboutView");
  }

  document.querySelectorAll(".mode-button, .wedge").forEach(el => {
    el.addEventListener("click", () => {
      const mode = el.dataset.mode;
      renderModePage(mode);
    });
  });

  window.navigate = viewId => {
    switch (viewId) {
      case "homeView": return renderHome();
      case "quickWinsView": return renderQuickWins();
      case "historyView": return renderHistory();
      case "aboutView": return renderAbout();
    }
  };

  startAppBtn.addEventListener("click", () => {
    welcomeModal.classList.add("hidden");
    appWrapper.classList.remove("hidden");
    renderHome();
  });

  // Initialize Splash + Welcome
  setTimeout(() => {
    splash.style.display = "none";
    if (!localStorage.getItem("hasVisited")) {
      welcomeModal.classList.remove("hidden");
      localStorage.setItem("hasVisited", "true");
    } else {
      appWrapper.classList.remove("hidden");
      renderHome();
    }
  }, 2200);
});