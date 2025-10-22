document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash-screen");
  const popup = document.getElementById("popup");
  const startBtn = document.getElementById("start-button");
  const app = document.getElementById("app");

  // Splash animation and popup trigger
  setTimeout(() => {
    splash.classList.add("hidden");

    if (!localStorage.getItem("welcomeSeen")) {
      popup.classList.remove("hidden");
    } else {
      app.classList.remove("hidden");
    }
  }, 1400);

  // Start button click
  startBtn.addEventListener("click", () => {
    localStorage.setItem("welcomeSeen", "true");
    popup.classList.add("hidden");
    app.classList.remove("hidden");
  });

  // Nav handling
  window.navigateTo = (target) => {
    const sections = ["home", "quickwins", "history", "about"];
    sections.forEach((sec) => {
      const el = document.getElementById(`${sec}-section`);
      if (el) el.style.display = sec === target ? "block" : "none";
    });
  };

  // Default to home
  navigateTo("home");
});
