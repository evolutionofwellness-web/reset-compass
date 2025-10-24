// Splash screen removal
window.addEventListener("load", () => {
  const splash = document.getElementById("splashScreen");
  setTimeout(() => {
    splash.style.display = "none";
    showWelcomeModalOnce();
  }, 1200);
});

// Welcome modal logic
function showWelcomeModalOnce() {
  const welcomeModal = document.getElementById("welcomeModal");
  const appWrapper = document.getElementById("appWrapper");
  const hasSeenModal = localStorage.getItem("hasSeenWelcome");

  if (!hasSeenModal) {
    welcomeModal.classList.remove("hidden");
    document.getElementById("startApp").addEventListener("click", () => {
      welcomeModal.classList.add("hidden");
      appWrapper.classList.remove("hidden");
      localStorage.setItem("hasSeenWelcome", "true");
    });
  } else {
    welcomeModal.classList.add("hidden");
    appWrapper.classList.remove("hidden");
  }
}

// Navigation function
function navigate(viewId) {
  const views = document.querySelectorAll("main > section");
  views.forEach((section) => section.classList.add("hidden"));

  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove("hidden");
  }
}

// Mode button click handler
document.addEventListener("DOMContentLoaded", () => {
  const modeButtons = document.querySelectorAll(".mode-button");
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.getAttribute("data-mode");
      alert(`You selected: ${mode}`);
      // Future functionality: Navigate to mode page
    });
  });

  // Nav setup for manual reloads
  navigate("homeView");
});