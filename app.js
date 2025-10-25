document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const icon = document.getElementById("splashIcon");
  const app = document.getElementById("appWrapper");
  const appContent = document.getElementById("appContent");
  const streakDisplay = document.getElementById("streakDisplay");

  // Splash logic
  splash.style.display = "flex";
  setTimeout(() => {
    splash.style.display = "none";
    app.classList.remove("hidden");
    updateStreak();
    renderHistory();
  }, 2000);

  // Navigation
  window.navigate = (target) => {
    const sections = appContent.querySelectorAll("section");
    sections.forEach(sec => sec.classList.add("hidden"));
    const active = document.getElementById(target);
    if (active) active.classList.remove("hidden");
    renderHistory();
    updateStreak();
  };

  // Mode navigation
  document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.getAttribute("data-mode");
      if (mode) {
        navigate(mode + "View");
      }
    });
  });

  // Compass wedges
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

  // Activity logging
  function logActivity(mode, inputText) {
    const today = new Date().toISOString().split("T")[0];
    const history = JSON.parse(localStorage.getItem("history") || "{}");

    if (!history[today]) history[today] = {};
    if (!history[today][mode]) history[today][mode] = [];

    if (inputText && !history[today][mode].includes(inputText)) {
      history[today][mode].push(inputText);
      localStorage.setItem("history", JSON.stringify(history));
      updateStreak();
    }
  }

  // Save activities on blur
  document.querySelectorAll("textarea").forEach(area => {
    area.addEventListener("blur", () => {
      const mode = area.dataset.mode;
      const value = area.value.trim();
      if (mode && value) {
        logActivity(mode, value);
      }
    });
  });

  // Streak tracker
  function updateStreak() {
    const history = JSON.parse(localStorage.getItem("history") || "{}");
    const dates = Object.keys(history).sort().reverse();
    let streak = 0;
    let current = new Date();

    for (let date of dates) {
      const dateStr = current.toISOString().split("T")[0];
      if (date === dateStr) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    if (streakDisplay) {
      streakDisplay.innerHTML = `🔥 ${streak}-day streak`;
    }
  }

  // History rendering
  function renderHistory() {
    const historyList = document.getElementById("historyList");
    if (!historyList) return;

    historyList.innerHTML = "";
    const history = JSON.parse(localStorage.getItem("history") || "{}");
    const dates = Object.keys(history).sort().reverse();

    dates.forEach(date => {
      const entry = history[date];
      const li = document.createElement("li");
      let html = `<strong>${date}</strong><br/>`;

      Object.keys(entry).forEach(mode => {
        const actions = entry[mode];
        html += `<em>${mode}:</em><ul>`;
        actions.forEach(a => {
          html += `<li>${a}</li>`;
        });
        html += "</ul>";
      });

      li.innerHTML = html;
      historyList.appendChild(li);
    });
  }

  // Run on load
  updateStreak();
  renderHistory();
});