// Splash screen and welcome popup logic
document.addEventListener("DOMContentLoaded", function () {
  const splash = document.getElementById("splashScreen");
  const popup = document.getElementById("welcomePopup");

  setTimeout(() => {
    splash.style.display = "none";

    if (!localStorage.getItem("resetCompassStarted")) {
      popup.style.display = "block";
    }
  }, 1500);

  const startBtn = document.getElementById("startButton");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      localStorage.setItem("resetCompassStarted", "true");
      popup.style.display = "none";
    });
  }

  renderCompass();
  renderStreak();
  renderHistory();
});

// Compass mode wedge rendering
function renderCompass() {
  const compass = document.getElementById("compass");
  if (!compass) return;

  const wedges = [
    { label: "Drifting", emoji: "🧭", class: "wedge-top-left", mode: "drifting" },
    { label: "Growing", emoji: "🚀", class: "wedge-top-right", mode: "growing" },
    { label: "Grounded", emoji: "🌿", class: "wedge-bottom-left", mode: "grounded" },
    { label: "Surviving", emoji: "🩺", class: "wedge-bottom-right", mode: "surviving" },
  ];

  compass.innerHTML = ""; // Clear existing content

  wedges.forEach(w => {
    const div = document.createElement("div");
    div.className = `wedge ${w.class}`;
    div.innerHTML = `<span>${w.emoji}<br>${w.label}</span>`;
    div.onclick = () => logMode(w.mode);
    compass.appendChild(div);
  });
}

// Mode logging and streak tracking
function logMode(mode) {
  const today = new Date().toISOString().split("T")[0];
  let history = JSON.parse(localStorage.getItem("resetCompassHistory") || "{}");

  history[today] = mode;
  localStorage.setItem("resetCompassHistory", JSON.stringify(history));

  renderStreak();
  renderHistory();
}

// Show 🔥 streak if continuous days are logged
function renderStreak() {
  const streakDiv = document.querySelector(".stats");
  if (!streakDiv) return;

  const history = JSON.parse(localStorage.getItem("resetCompassHistory") || "{}");
  const dates = Object.keys(history).sort().reverse();

  let streak = 0;
  let current = new Date();

  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]);
    if (d.toDateString() === current.toDateString()) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  streakDiv.innerHTML = `🔥 ${streak} day streak`;
}

// Mode history rendering
function renderHistory() {
  const historySection = document.getElementById("historySection");
  if (!historySection) return;

  const history = JSON.parse(localStorage.getItem("resetCompassHistory") || "{}");
  const dates = Object.keys(history).sort().reverse();

  historySection.innerHTML = dates
    .map(date => {
      const mode = history[date];
      return `<p><strong>${date}:</strong> ${mode.charAt(0).toUpperCase() + mode.slice(1)}</p>`;
    })
    .join("");
}
