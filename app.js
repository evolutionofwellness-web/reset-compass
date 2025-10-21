// Splash screen fade out
window.addEventListener("load", () => {
  const splash = document.getElementById("splashScreen");
  splash.classList.add("fade-out");
  setTimeout(() => {
    splash.style.display = "none";
    if (!localStorage.getItem("welcomeShown")) {
      document.getElementById("welcomePopup").style.display = "block";
    }
  }, 1000);
});

// Hide welcome popup and show app
document.getElementById("startButton").addEventListener("click", () => {
  document.getElementById("welcomePopup").style.display = "none";
  localStorage.setItem("welcomeShown", "true");
});

// Section navigation
function showSection(id) {
  document.querySelectorAll("main > section").forEach(section => {
    section.style.display = section.id === id ? "block" : "none";
  });
}

// Mode selection, logging, and streak handling
function selectMode(mode) {
  const today = new Date().toISOString().split("T")[0];
  const history = JSON.parse(localStorage.getItem("modeHistory") || "{}");
  history[today] = mode;
  localStorage.setItem("modeHistory", JSON.stringify(history));
  updateHistory();
  updateStreak();
  alert(`Logged mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
}

// Update mode history list
function updateHistory() {
  const history = JSON.parse(localStorage.getItem("modeHistory") || "{}");
  const container = document.getElementById("mode-history");
  container.innerHTML = "";
  const dates = Object.keys(history).sort().reverse();
  dates.forEach(date => {
    const entry = document.createElement("div");
    entry.textContent = `${date}: ${history[date]}`;
    container.appendChild(entry);
  });
}

// Streak calculation
function updateStreak() {
  const history = JSON.parse(localStorage.getItem("modeHistory") || "{}");
  const today = new Date();
  let streak = 0;

  for (let i = 0; ; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const key = checkDate.toISOString().split("T")[0];
    if (history[key]) {
      streak++;
    } else {
      break;
    }
  }

  document.getElementById("streakCount").textContent = streak;
}

// On load
document.addEventListener("DOMContentLoaded", () => {
  updateHistory();
  updateStreak();
});
