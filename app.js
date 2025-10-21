// Splash Screen Logic
window.addEventListener("load", () => {
  setTimeout(() => {
    const splash = document.getElementById("splashScreen");
    splash.style.opacity = "0";
    splash.style.pointerEvents = "none";
    setTimeout(() => splash.style.display = "none", 300);

    if (!localStorage.getItem("welcomeShown")) {
      document.getElementById("welcomePopup").style.display = "block";
    }
  }, 1400);
});

// Welcome Popup Logic
document.getElementById("startButton").addEventListener("click", () => {
  document.getElementById("welcomePopup").style.display = "none";
  localStorage.setItem("welcomeShown", "true");
});

// Navigation Between Sections
function showSection(sectionId) {
  const sections = document.querySelectorAll("main .section");
  sections.forEach((section) => {
    section.style.display = "none";
  });
  document.getElementById(sectionId).style.display = "block";
}

// Mode Selection & Logging
function selectMode(mode) {
  const now = new Date().toLocaleDateString();
  const history = JSON.parse(localStorage.getItem("modeHistory")) || [];

  if (!history.find(entry => entry.date === now)) {
    history.push({ date: now, mode });
    localStorage.setItem("modeHistory", JSON.stringify(history));
    updateStreak(history);
    renderHistory(history);
  }

  alert(`You selected: ${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`);
}

// Streak Calculation
function updateStreak(history) {
  history.sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  let currentDate = new Date();

  for (let i = 0; i < history.length; i++) {
    const entryDate = new Date(history[i].date);
    if (entryDate.toDateString() === currentDate.toDateString()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  document.getElementById("streakCount").textContent = streak;
}

// History Renderer
function renderHistory(history) {
  const container = document.getElementById("mode-history");
  container.innerHTML = "";

  history.slice().reverse().forEach(entry => {
    const item = document.createElement("div");
    item.textContent = `✔️ ${entry.date}: ${entry.mode}`;
    container.appendChild(item);
  });
}

// Restore history and streak on load
window.addEventListener("DOMContentLoaded", () => {
  const history = JSON.parse(localStorage.getItem("modeHistory")) || [];
  updateStreak(history);
  renderHistory(history);
});
