document.addEventListener("DOMContentLoaded", () => {
  const splashScreen = document.getElementById("splashScreen");
  const welcomeModal = document.getElementById("welcomeModal");
  const startAppBtn = document.getElementById("startApp");
  const appWrapper = document.getElementById("appWrapper");
  const streakDisplay = document.getElementById("streakDisplay");

  // Show welcome modal only once
  if (!localStorage.getItem("welcomeShown")) {
    welcomeModal.classList.remove("hidden");
  } else {
    initApp();
  }

  startAppBtn.addEventListener("click", () => {
    localStorage.setItem("welcomeShown", "true");
    welcomeModal.classList.add("hidden");
    initApp();
  });

  function initApp() {
    appWrapper.classList.remove("hidden");
    updateStreakDisplay();
    setupCompassListeners();
    setupModeButtons();
  }

  // Splash fade
  setTimeout(() => {
    splashScreen.style.display = "none";
  }, 3000);

  function navigate(viewId) {
    document.querySelectorAll("main section").forEach(section => {
      section.classList.add("hidden");
    });
    document.getElementById(viewId).classList.remove("hidden");
  }

  // Compass Wedge Clicks
  function setupCompassListeners() {
    document.querySelectorAll("#compass path").forEach(wedge => {
      wedge.addEventListener("click", () => {
        const mode = wedge.dataset.mode;
        logModeUse(mode);
        alert(`You selected ${mode}`);
      });
    });
  }

  // Mode Buttons
  function setupModeButtons() {
    document.querySelectorAll(".mode-button").forEach(button => {
      button.addEventListener("click", () => {
        const mode = button.dataset.mode;
        logModeUse(mode);
        alert(`You selected ${mode}`);
      });
    });
  }

  // Logging Mode & Updating Streak
  function logModeUse(mode) {
    const today = new Date().toISOString().split("T")[0];
    const lastLogDate = localStorage.getItem("lastLogDate");

    if (lastLogDate !== today) {
      const currentStreak = parseInt(localStorage.getItem("dailyStreak") || "0");
      const newStreak = lastLogDate === getYesterdayDate() ? currentStreak + 1 : 1;
      localStorage.setItem("dailyStreak", newStreak);
      localStorage.setItem("lastLogDate", today);
      updateStreakDisplay();
    }
  }

  function updateStreakDisplay() {
    const streak = localStorage.getItem("dailyStreak") || 0;
    streakDisplay.textContent = `🔥 Daily Streak: ${streak}`;
  }

  function getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }

  // Expose navigate globally
  window.navigate = navigate;
});