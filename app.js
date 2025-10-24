document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  const welcomeModal = document.getElementById("welcomeModal");
  const appWrapper = document.getElementById("appWrapper");
  const startButton = document.getElementById("startApp");

  // Splash animation
  setTimeout(() => {
    splash.style.display = "none";

    const hasSeen = localStorage.getItem("welcomeSeen");
    if (!hasSeen) {
      welcomeModal.classList.remove("hidden");
    } else {
      appWrapper.classList.remove("hidden");
      navigate("homeView");
    }
  }, 1200);

  // Start App button
  if (startButton) {
    startButton.addEventListener("click", () => {
      welcomeModal.classList.add("hidden");
      localStorage.setItem("welcomeSeen", "true");
      appWrapper.classList.remove("hidden");
      navigate("homeView");
    });
  }

  // Safe Navigation
  window.navigate = function(viewId) {
    const viewIds = ["homeView", "quickWinsView", "historyView", "aboutView"];
    viewIds.forEach(id => {
      const section = document.getElementById(id);
      if (section) section.classList.add("hidden");
    });

    const target = document.getElementById(viewId);
    if (target) target.classList.remove("hidden");
  };

  // TEMP: Click handlers for wedges/buttons
  const modeElements = document.querySelectorAll(".wedge, .mode-button");
  modeElements.forEach(el => {
    el.addEventListener("click", () => {
      const mode = el.getAttribute("data-mode");
      if (mode) {
        console.log("Clicked mode:", mode);
        // Placeholder logic — full loadMode() coming next
        alert(`You selected: ${mode}`);
      }
    });
  });
});