document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const modal = document.getElementById("welcomeModal");
  const app = document.getElementById("appWrapper");
  const startBtn = document.getElementById("startApp");
  const appContent = document.getElementById("appContent");
  const streakDisplay = document.getElementById("streakDisplay");

  // Show splash, then welcome modal
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

  // Start app after welcome
  startBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    localStorage.setItem("seenWelcome", "true");
    app.classList.remove("hidden");
    updateStreak();
  });

  // Page navigation
  window.navigate = (target) => {
    const views = appContent.querySelectorAll("section");
    views.forEach(view => view.classList.add("hidden"));
    document.getElementById(target).classList.remove("hidden");
  };

  // Click handlers for compass + buttons
  const setMode = (mode) => {
    const today = new Date().toISOString().split("T")[0];
    const history = JSON.parse(localStorage.getItem("history") || "{}");
    if (!history[today]) {
      history[today] = mode;
      localStorage.setItem("history", JSON.stringify(history));
    }
    updateStreak();
    alert(`You selected "${mode}" mode. Great choice!`);
  };

  document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.getAttribute("data-mode");
      setMode(mode);
    });
  });

  const compass = document.getElementById("compass");
  if (compass) {
    compass.querySelectorAll("path").forEach(path => {
      path.addEventListener("click", () => {
        const mode = path.getAttribute("data-mode");
        setMode(mode);
      });
    });
  }

  // Streak Tracker
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
});