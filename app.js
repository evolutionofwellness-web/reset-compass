document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const welcomeModal = document.getElementById("welcomeModal");
  const appWrapper = document.getElementById("appWrapper");

  // Hide splash after delay
  setTimeout(() => {
    splash.style.display = "none";

    if (!localStorage.getItem("welcomeSeen")) {
      welcomeModal.classList.remove("hidden");
    } else {
      appWrapper.classList.remove("hidden");
    }
  }, 1200);

  // Start button event
  document.getElementById("startApp").addEventListener("click", () => {
    welcomeModal.classList.add("hidden");
    localStorage.setItem("welcomeSeen", true);
    appWrapper.classList.remove("hidden");
  });

  // Navigation
  window.navigate = function (viewId) {
    ["homeView", "quickWinsView", "historyView", "aboutView"].forEach(id => {
      document.getElementById(id).classList.add("hidden");
    });
    document.getElementById(viewId).classList.remove("hidden");
  };

  // Mode wedge and button click logic
  document.querySelectorAll(".wedge, .mode-button").forEach(el => {
    el.addEventListener("click", () => {
      const mode = el.getAttribute("data-mode");
      if (mode) loadMode(mode);
    });
  });
});

// Sample mode load function (must exist elsewhere in your JS)
function loadMode(mode) {
  console.log(`Mode selected: ${mode}`);
  // implement loading logic for mode views
}