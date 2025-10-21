// Splash Screen Animation
window.addEventListener("load", () => {
  const splash = document.getElementById("splashScreen");
  const splashIcon = document.getElementById("splashIcon");

  splashIcon.classList.add("zoom");
  setTimeout(() => {
    splash.style.display = "none";

    // Show welcome popup if first visit
    if (!localStorage.getItem("welcomeShown")) {
      document.getElementById("welcomePopup").style.display = "block";
    }
  }, 1500);
});

// Start Button on Welcome Popup
document.getElementById("startButton").addEventListener("click", () => {
  document.getElementById("welcomePopup").style.display = "none";
  localStorage.setItem("welcomeShown", "true");
});

// Inject Compass Wedges
function renderCompass() {
  const compass = document.getElementById("compass");
  compass.innerHTML = `
    <div class="compass-circle">
      <div class="wedge wedge-top" onclick="selectMode('growing')"><span>Growing</span></div>
      <div class="wedge wedge-left" onclick="selectMode('grounded')"><span>Grounded</span></div>
      <div class="wedge wedge-right" onclick="selectMode('drifting')"><span>Drifting</span></div>
      <div class="wedge wedge-bottom" onclick="selectMode('surviving')"><span>Surviving</span></div>
    </div>
  `;
}
renderCompass();

// Navigation
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.style.display = "none";
  });
  document.getElementById(sectionId).style.display = "block";
}

// Mode Logging + Streak
function selectMode(mode) {
  const today = new Date().toISOString().split("T")[0];
  let history = JSON.parse(localStorage.getItem("modeHistory") || "[]");

  // Only log once per day
  if (!history.find(entry => entry.date === today)) {
    history.push({ date: today, mode });
    localStorage.setItem("modeHistory", JSON.stringify(history));
    updateStreak(history);
    renderHistory(history);
  }

  alert(`You selected: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
}

// Streak Logic
function updateStreak(history) {
  const dates = history.map(entry => entry.date).sort().reverse();
  let streak = 0;
  let currentDate = new Date();

  for (let date of dates) {
    const entryDate = new Date(date);
    if (entryDate.toDateString() === currentDate.toDateString()) {
      streak++;
    } else {
      currentDate.setDate(currentDate.getDate() - 1);
      if (entryDate.toDateString() === currentDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
  }

  document.getElementById("streakCount").innerText = streak;
}

// Render History
function renderHistory(history = JSON.parse(localStorage.getItem("modeHistory") || "[]")) {
  const container = document.getElementById("mode-history");
  if (!container) return;

  container.innerHTML = "";
  const sorted = history.sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach(entry => {
    const div = document.createElement("div");
    div.className = "history-entry";
    div.innerText = `${entry.date}: ${entry.mode}`;
    container.appendChild(div);
  });
}

// On Load
renderHistory();
updateStreak(JSON.parse(localStorage.getItem("modeHistory") || "[]"));
