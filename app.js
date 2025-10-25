document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const modal = document.getElementById("welcomeModal");
  const app = document.getElementById("appWrapper");
  const startBtn = document.getElementById("startApp");
  const appContent = document.getElementById("appContent");
  const streakDisplay = document.getElementById("streakDisplay");

  // === Splash → Welcome → App ===
  setTimeout(() => {
    splash.style.display = "none";

    const hasSeen = localStorage.getItem("seenWelcome");
    if (!hasSeen) {
      modal.classList.remove("hidden");
    } else {
      app.classList.remove("hidden");
      updateStreak();
    }
  }, 1500);

  startBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    localStorage.setItem("seenWelcome", "true");
    app.classList.remove("hidden");
    updateStreak();
  });

  // === Page Navigation ===
  window.navigate = (target) => {
    const views = appContent.querySelectorAll("section");
    views.forEach(view => view.classList.add("hidden"));
    document.getElementById(target).classList.remove("hidden");
    updateStreak();
    renderHistory();
  };

  // === Streak Logic ===
  function updateStreak() {
    const history = JSON.parse(localStorage.getItem("history") || "{}");
    const dates = Object.keys(history).sort().reverse();
    let streak = 0;
    let currentDate = new Date();

    for (let date of dates) {
      const dateStr = currentDate.toISOString().split("T")[0];
      if (date === dateStr) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    if (streakDisplay) {
      streakDisplay.innerHTML = `🔥 ${streak}-day streak`;
    }
  }

  function logActivity(mode, inputText) {
    const today = new Date().toISOString().split("T")[0];
    const history = JSON.parse(localStorage.getItem("history") || "{}");
    if (!history[today]) {
      history[today] = {};
    }

    if (!history[today][mode]) {
      history[today][mode] = [];
    }

    if (inputText && !history[today][mode].includes(inputText)) {
      history[today][mode].push(inputText);
      localStorage.setItem("history", JSON.stringify(history));
      updateStreak();
    }
  }

  // === Compass Click ===
  const compass = document.getElementById("compass");
  if (compass) {
    compass.querySelectorAll("path").forEach(path => {
      path.addEventListener("click", () => {
        const mode = path.getAttribute("data-mode");
        if (mode) {
          navigate(mode + "View");
        }
      });
    });
  }

  // === Mode Button Clicks ===
  document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.getAttribute("data-mode");
      if (mode) {
        navigate(mode + "View");
      }
    });
  });

  // === Input Logging (Modes + Quick Wins) ===
  document.querySelectorAll("textarea").forEach(textarea => {
    textarea.addEventListener("blur", () => {
      const mode = textarea.dataset.mode;
      const value = textarea.value.trim();
      if (mode && value) {
        logActivity(mode, value);
      }
    });
  });

  // === History Rendering ===
  function renderHistory() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    historyList.innerHTML = "";

    const history = JSON.parse(localStorage.getItem("history") || "{}");
    const sortedDates = Object.keys(history).sort().reverse();

    sortedDates.forEach(date => {
      const entry = history[date];
      const listItem = document.createElement("li");
      let html = `<strong>${date}</strong><br/>`;

      Object.keys(entry).forEach(mode => {
        const actions = entry[mode];
        if (Array.isArray(actions)) {
          html += `<em>${mode}:</em><ul>`;
          actions.forEach(action => {
            html += `<li>${action}</li>`;
          });
          html += `</ul>`;
        }
      });

      listItem.innerHTML = html;
      historyList.appendChild(listItem);
    });
  }

  renderHistory();
});