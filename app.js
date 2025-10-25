document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const modal = document.getElementById("welcomeModal");
  const app = document.getElementById("appWrapper");
  const startBtn = document.getElementById("startApp");
  const appContent = document.getElementById("appContent");
  const streakDisplay = document.getElementById("streakDisplay");

  // === Splash transition ===
  setTimeout(() => {
    splash.style.display = "none";

    const hasSeen = localStorage.getItem("seenWelcome");
    if (!hasSeen) {
      modal.classList.remove("hidden");
    } else {
      app.classList.remove("hidden");
      updateStreak();
      renderHistory();
    }
  }, 1600);

  // === Start app button ===
  startBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
    localStorage.setItem("seenWelcome", "true");
    app.classList.remove("hidden");
    updateStreak();
    renderHistory();
  });

  // === Navigation ===
  window.navigate = (target) => {
    const sections = appContent.querySelectorAll("section");
    sections.forEach(sec => sec.classList.add("hidden"));
    const targetSection = document.getElementById(target);
    if (targetSection) targetSection.classList.remove("hidden");
    if (target === "history") renderHistory();
  };

  // === Mode selection ===
  const setMode = (mode) => {
    const today = new Date().toISOString().split("T")[0];
    const history = JSON.parse(localStorage.getItem("history") || "{}");

    if (!history[today]) {
      history[today] = { mode, activities: [] };
      localStorage.setItem("history", JSON.stringify(history));
    }

    updateStreak();
    alert(`You selected "${mode}" mode. Let's go!`);
    navigate(mode.toLowerCase());
  };

  // === Compass wedges click ===
  const compass = document.getElementById("compass");
  if (compass) {
    compass.querySelectorAll("path").forEach(path => {
      path.addEventListener("click", () => {
        const mode = path.getAttribute("data-mode");
        if (mode) setMode(mode);
      });
    });
  }

  // === Mode buttons click ===
  document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.getAttribute("data-mode");
      if (mode) setMode(mode);
    });
  });

  // === Activity logging ===
  document.querySelectorAll(".mode-activity textarea").forEach(textarea => {
    textarea.addEventListener("blur", () => {
      const activityText = textarea.value.trim();
      const mode = textarea.closest("section").id;
      const today = new Date().toISOString().split("T")[0];
      const history = JSON.parse(localStorage.getItem("history") || "{}");

      if (!history[today]) {
        history[today] = { mode, activities: [] };
      }

      if (activityText && !history[today].activities.includes(activityText)) {
        history[today].activities.push(activityText);
        localStorage.setItem("history", JSON.stringify(history));
        updateStreak();
      }
    });
  });

  // === Quick win textarea logging ===
  document.querySelectorAll("#quickWins textarea").forEach(textarea => {
    textarea.addEventListener("blur", () => {
      const text = textarea.value.trim();
      const today = new Date().toISOString().split("T")[0];
      const history = JSON.parse(localStorage.getItem("history") || "{}");

      if (!history[today]) {
        history[today] = { mode: "Quick", activities: [] };
      }

      if (text && !history[today].activities.includes(text)) {
        history[today].activities.push(text);
        localStorage.setItem("history", JSON.stringify(history));
        updateStreak();
      }
    });
  });

  // === Streak Tracker ===
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

  // === History Renderer ===
  function renderHistory() {
    const historyBox = document.getElementById("historyContent");
    if (!historyBox) return;

    const history = JSON.parse(localStorage.getItem("history") || "{}");
    const entries = Object.entries(history).sort((a, b) => b[0].localeCompare(a[0]));

    if (entries.length === 0) {
      historyBox.innerHTML = "<p>No activity yet. Start logging today!</p>";
      return;
    }

    historyBox.innerHTML = entries.map(([date, data]) => {
      const items = data.activities.map(act => `<li>${act}</li>`).join("");
      return `
        <div style="margin-bottom: 1rem;">
          <strong>${date}</strong> — Mode: ${data.mode}
          <ul>${items}</ul>
        </div>
      `;
    }).join("");
  }
});