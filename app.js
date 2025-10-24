document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const welcomeModal = document.getElementById("welcomeModal");
  const appWrapper = document.getElementById("appWrapper");
  const startButton = document.getElementById("startApp");

  setTimeout(() => {
    splash.style.display = "none";

    if (!localStorage.getItem("welcomeSeen")) {
      welcomeModal.classList.remove("hidden");
    } else {
      appWrapper.classList.remove("hidden");
    }
  }, 1200);

  if (startButton) {
    startButton.addEventListener("click", () => {
      welcomeModal.classList.add("hidden");
      localStorage.setItem("welcomeSeen", "true");
      appWrapper.classList.remove("hidden");
    });
  }

  // Navigation
  window.navigate = function (viewId) {
    const views = ["homeView", "quickWinsView", "historyView", "aboutView"];
    views.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add("hidden");
    });

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove("hidden");
  };

  // Wedge + Button click handlers
  document.querySelectorAll(".wedge, .mode-button").forEach((el) => {
    el.addEventListener("click", () => {
      const mode = el.getAttribute("data-mode");
      if (mode) {
        alert(`You selected: ${mode}`);
        // Replace this alert with loadMode(mode) once implemented
      }
    });
  });
});