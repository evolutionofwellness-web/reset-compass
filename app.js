// app.js?v=10

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splashScreen");
  setTimeout(() => splash.style.display = "none", 2000);

  const hasSeenPopup = localStorage.getItem("seenWelcome");
  const popup = document.getElementById("welcomePopup");
  const startBtn = document.getElementById("startButton");

  if (!hasSeenPopup && popup) {
    popup.style.display = "flex";
    startBtn.onclick = () => {
      popup.style.display = "none";
      localStorage.setItem("seenWelcome", "true");
    };
  }

  const streak = localStorage.getItem("streak") || 0;
  document.getElementById("streak").textContent = streak;
});

function navigateTo(page) {
  alert(`Navigating to ${page} page... (function placeholder)`);
}

function openMode(mode) {
  window.location.href = `${mode}.html`;
}