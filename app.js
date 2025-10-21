document.addEventListener("DOMContentLoaded", () => {
  const splashScreen = document.getElementById("splashScreen");
  const welcomePopup = document.getElementById("welcomePopup");
  const startButton = document.getElementById("startButton");
  const compass = document.getElementById("compass");
  const modeButtons = document.querySelectorAll(".mode-btn");
  const wedges = document.querySelectorAll(".wedge");
  const section = document.querySelector(".section");

  // Splash + Popup
  setTimeout(() => {
    splashScreen.style.display = "none";
    if (!localStorage.getItem("hasSeenWelcome")) {
      welcomePopup.style.display = "block";
    }
  }, 2000);

  startButton.addEventListener("click", () => {
    welcomePopup.style.display = "none";
    localStorage.setItem("hasSeenWelcome", "true");
  });

  // Event listeners for wedges and buttons
  function initModeNavigation() {
    wedges.forEach(wedge => {
      wedge.addEventListener("click", () => {
        const mode = wedge.getAttribute("data-mode");
        loadMode(mode);
      });
    });

    modeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-mode");
        loadMode(mode);
      });
    });
  }

  // Activities per mode
  const modeActivities = {
    grow: [
      "Do something that challenges you",
      "Take action on a long-term goal",
      "Declutter a space or complete a small project"
    ],
    ground: [
      "Take 3 deep breaths",
      "Drink a full glass of water",
      "Write down 3 things you're grateful for"
    ],
    drift: [
      "Check in with how you're feeling",
      "Spend 5 minutes stretching or moving",
      "Reflect on what matters to you"
    ],
    surv: [
      "Pick ONE thing to focus on",
      "Set a 10-minute timer and start",
      "Pause and do nothing for 1 minute"
    ]
  };

  function loadMode(mode) {
    const activities = modeActivities[mode] || [];
    section.innerHTML = `
      <h2>${modeName(mode)} Mode</h2>
      <div class="activities-container">
        ${activities.map((activity, i) => `
          <div class="activity-entry">
            <strong>${activity}</strong>
            <textarea placeholder="What did you do?"></textarea>
            <button onclick="saveLog('${mode}', ${i}, this)">Save</button>
          </div>
        `).join("")}
      </div>
    `;
  }

  // Human-readable mode name
  function modeName(mode) {
    switch (mode) {
      case "grow": return "Growing";
      case "ground": return "Grounded";
      case "drift": return "Drifting";
      case "surv": return "Surviving";
      default: return "";
    }
  }

  // Save to localStorage with streak tracking
  window.saveLog = function(mode, index, btn) {
    const entry = btn.previousElementSibling.value.trim();
    if (!entry) return;

    const date = new Date().toLocaleDateString();
    const log = { date, mode, entry, activity: modeActivities[mode][index] };

    let history = JSON.parse(localStorage.getItem("resetHistory")) || [];
    const todayExists = history.some(h => h.date === date);
    history.push(log);
    localStorage.setItem("resetHistory", JSON.stringify(history));

    // Streak logic
    if (!todayExists) {
      let streak = parseInt(localStorage.getItem("resetStreak") || "0", 10);
      let lastDate = localStorage.getItem("resetLastDate");

      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (lastDate === yesterday) {
        streak++;
      } else if (lastDate !== today) {
        streak = 1;
      }

      localStorage.setItem("resetStreak", streak);
      localStorage.setItem("resetLastDate", today);
      updateStats();
    }

    btn.textContent = "Saved!";
    btn.disabled = true;
  };

  // Stats and history
  function updateStats() {
    const stats = document.querySelector(".stats");
    const streak = localStorage.getItem("resetStreak") || "0";
    stats.innerHTML = `🔥 ${streak}-day streak`;

    const history = JSON.parse(localStorage.getItem("resetHistory")) || [];
    const historyBlock = document.getElementById("historyBlock");
    if (historyBlock) {
      historyBlock.innerHTML = history.map(h => `
        <div class="history-entry">
          <strong>${h.date}</strong> — ${modeName(h.mode)}: ${h.activity}<br>
          <em>${h.entry}</em>
        </div>
      `).reverse().join("");
    }
  }

  initModeNavigation();
  updateStats();
});