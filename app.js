// app.js?v=9

document.addEventListener("DOMContentLoaded", () => {
  // Splash screen logic
  const splash = document.getElementById("splash-screen");
  const appContent = document.getElementById("appContent");

  setTimeout(() => {
    splash.classList.add("fade-out");
    splash.addEventListener("animationend", () => {
      splash.style.display = "none";
      appContent.style.display = "block";
    });
  }, 1200);

  // Welcome popup logic
  const hasVisited = localStorage.getItem("hasVisited");
  const popup = document.getElementById("welcome-popup");
  const startButton = document.getElementById("start-button");

  if (!hasVisited && popup && startButton) {
    popup.style.display = "flex";
    startButton.addEventListener("click", () => {
      popup.style.display = "none";
      localStorage.setItem("hasVisited", "true");
    });
  }

  // Navigation logic
  const navButtons = document.querySelectorAll(".nav-button");
  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      const sectionId = button.getAttribute("data-section");
      document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
      const target = document.getElementById(`${sectionId}-section`);
      if (target) target.style.display = "block";
    });
  });

  // Mode selection logic
  const modes = {
    growing: {
      emoji: "🚀",
      name: "Growing",
      color: "#3498db",
      activities: ["Tried a new habit", "Learned something", "Took a positive risk"]
    },
    drifting: {
      emoji: "🧭",
      name: "Drifting",
      color: "#f39c12",
      activities: ["Scrolled aimlessly", "Procrastinated", "Felt scattered"]
    },
    surviving: {
      emoji: "🩺",
      name: "Surviving",
      color: "#e74c3c",
      activities: ["Pushed through stress", "Felt overwhelmed", "Reacted emotionally"]
    },
    grounded: {
      emoji: "🌱",
      name: "Grounded",
      color: "#2ecc71",
      activities: ["Breathed deeply", "Moved gently", "Stayed present"]
    }
  };

  const modeButtons = document.querySelectorAll(".mode-button");
  const wedges = document.querySelectorAll(".wedge");
  const modeSection = document.getElementById("mode-section");

  function renderMode(modeKey) {
    const mode = modes[modeKey];
    if (!mode) return;

    document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
    modeSection.innerHTML = `
      <h2>${mode.emoji} ${mode.name}</h2>
      <ul>
        ${mode.activities.map(act => `<li>${act}</li>`).join("")}
      </ul>
      <textarea placeholder="What did you do?" id="entry-text"></textarea>
      <button class="save-button" data-mode="${modeKey}">Save</button>
    `;
    modeSection.style.display = "block";
  }

  wedges.forEach(w => {
    w.addEventListener("click", () => renderMode(w.getAttribute("data-mode")));
  });

  modeButtons.forEach(b => {
    b.addEventListener("click", () => renderMode(b.getAttribute("data-mode")));
  });

  // Save button + history logic
  const historySection = document.getElementById("history-section");
  const historyContent = document.getElementById("history-content");

  function renderHistory() {
    const history = JSON.parse(localStorage.getItem("activityHistory") || "[]");
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const streak = calculateStreak(history, today);

    historySection.querySelector("#streak-count").textContent = streak;

    const grouped = history.reduce((acc, entry) => {
      if (!acc[entry.mode]) acc[entry.mode] = [];
      acc[entry.mode].push(entry);
      return acc;
    }, {});

    historyContent.innerHTML = Object.entries(grouped)
      .map(([mode, entries]) => `
        <h3>${modes[mode].emoji} ${modes[mode].name}</h3>
        <ul>${entries.map(e => `<li>${e.date}: ${e.text}</li>`).join("")}</ul>
      `).join("");
  }

  function calculateStreak(history, today) {
    const days = new Set(history.map(e => e.date));
    let streak = 0;
    let current = new Date(today);

    while (days.has(current.toISOString().split("T")[0])) {
      streak++;
      current.setDate(current.getDate() - 1);
    }
    return streak;
  }

  document.addEventListener("click", e => {
    if (e.target.classList.contains("save-button")) {
      const mode = e.target.getAttribute("data-mode");
      const text = document.getElementById("entry-text").value;
      if (!text.trim()) return;

      const history = JSON.parse(localStorage.getItem("activityHistory") || "[]");
      const date = new Date().toISOString().split("T")[0];
      history.push({ mode, text, date });
      localStorage.setItem("activityHistory", JSON.stringify(history));
      renderHistory();

      // Auto-switch to history
      document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
      historySection.style.display = "block";
    }
  });

  renderHistory(); // Initialize on load
});