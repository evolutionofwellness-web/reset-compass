document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const modal = document.getElementById("welcomeModal");
  const app = document.getElementById("appWrapper");
  const startBtn = document.getElementById("startApp");
  const appContent = document.getElementById("appContent");
  const streakDisplay = document.getElementById("streakDisplay");
  const historyList = document.getElementById("historyList");

  // Splash > Modal > App
  setTimeout(() => {
    splash.style.display = "none";
    const seen = localStorage.getItem("seenWelcome");
    if (!seen) {
      modal.classList.remove("hidden");
    } else {
      app.classList.remove("hidden");
      updateStreak();
      loadHistory();
    }
  }, 1500);

  // Start button
  startBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    localStorage.setItem("seenWelcome", "true");
    app.classList.remove("hidden");
    updateStreak();
    loadHistory();
  });

  // Navigation
  window.navigate = (target) => {
    const views = appContent.querySelectorAll("section");
    views.forEach(view => view.classList.add("hidden"));
    document.getElementById(target).classList.remove("hidden");
  };

  // Streak logic
  function updateStreak() {
    const history = JSON.parse(localStorage.getItem("history") || "{}");
    const dates = Object.keys(history).sort().reverse();
    let streak = 0;
    let current = new Date();

    for (let date of dates) {
      const currentStr = current.toISOString().split("T")[0];
      if (date === currentStr) {
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

  // Logging
  function logActivity(mode, activityText) {
    const today = new Date().toISOString().split("T")[0];
    const history = JSON.parse(localStorage.getItem("history") || "{}");

    if (!history[today]) {
      history[today] = [];
    }

    const logged = history[today].some(item => item.mode === mode && item.text === activityText);
    if (!logged && activityText.trim()) {
      history[today].push({ mode, text: activityText });
      localStorage.setItem("history", JSON.stringify(history));
      updateStreak();
      loadHistory();
    }
  }

  // Load history
  function loadHistory() {
    const history = JSON.parse(localStorage.getItem("history") || "{}");
    historyList.innerHTML = "";
    const dates = Object.keys(history).sort().reverse();
    dates.forEach(date => {
      history[date].forEach(entry => {
        const li = document.createElement("li");
        li.textContent = `${date} — ${entry.mode}: ${entry.text}`;
        historyList.appendChild(li);
      });
    });
  }

  // Activity submission
  document.querySelectorAll(".mode-activity textarea").forEach(textarea => {
    textarea.addEventListener("blur", () => {
      const mode = textarea.getAttribute("data-mode");
      const text = textarea.value;
      logActivity(mode, text);
    });
  });

  // Compass click
  const compass = document.getElementById("compass");
  if (compass) {
    compass.querySelectorAll("path").forEach(path => {
      path.addEventListener("click", () => {
        const mode = path.getAttribute("data-mode");
        alert(`You selected "${mode}" mode`);
        window.navigate(mode.toLowerCase() + "View");
      });
    });
  }

  // Button click
  document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.getAttribute("data-mode");
      window.navigate(mode.toLowerCase() + "View");
    });
  });
});