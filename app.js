document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const welcomeModal = document.getElementById("welcomeModal");
  const appWrapper = document.getElementById("appWrapper");
  const startBtn = document.getElementById("startApp");

  // Hide splash screen after delay
  setTimeout(() => {
    splash.style.display = "none";

    // Show welcome modal or app
    if (!localStorage.getItem("welcomeSeen")) {
      welcomeModal.classList.remove("hidden");
    } else {
      appWrapper.classList.remove("hidden");
    }
  }, 1200);

  // Start app button
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      welcomeModal.classList.add("hidden");
      localStorage.setItem("welcomeSeen", true);
      appWrapper.classList.remove("hidden");
    });
  }

  // Navigation
  window.navigate = function(viewId) {
    const views = ["homeView", "quickWinsView", "historyView", "aboutView"];
    views.forEach(id => {
      const view = document.getElementById(id);
      if (view) view.classList.add("hidden");
    });

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove("hidden");
  };

  // Wedge and mode buttons
  document.querySelectorAll(".wedge, .mode-button").forEach(el => {
    el.addEventListener("click", () => {
      const mode = el.getAttribute("data-mode");
      if (mode && typeof loadMode === "function") {
        loadMode(mode);
      }
    });
  });
});