document.addEventListener("DOMContentLoaded", () => {
  // Splash screen animation
  const splashIcon = document.getElementById("splashIcon");
  const splashScreen = document.getElementById("splashScreen");
  if (splashIcon && splashScreen) {
    splashIcon.classList.add("splash-animate");
    setTimeout(() => splashScreen.style.display = "none", 1800);
  }

  // Show welcome popup only on first visit
  const welcomePopup = document.getElementById("welcomePopup");
  if (welcomePopup && !localStorage.getItem("welcomeShown")) {
    welcomePopup.classList.add("active");
  }
  document.getElementById("closePopup")?.addEventListener("click", () => {
    welcomePopup.classList.remove("active");
    localStorage.setItem("welcomeShown", "true");
  });

  // Load app
  loadContent();
  updateStats();
});

// Navigation
function navigate(path) {
  window.location.hash = path;
  loadContent();
}

window.onhashchange = loadContent;

function loadContent() {
  const app = document.getElementById("app");
  const route = window.location.hash || "#/home";
  app.innerHTML = "";

  switch (route) {
    case "#/wins":
      renderQuickWins(app);
      break;
    case "#/history":
      renderHistory(app);
      break;
    case "#/about":
      renderAbout(app);
      break;
    default:
      renderHome(app);
  }
}

// Core views
function renderHome(container) {
  container.innerHTML = `
    <div class="stats">
      <p>Today: <strong>${getTodayMode() || 0}</strong></p>
      <p>Daily streak: <strong>${getStreak()}</strong></p>
    </div>
    <div class="mode-description">
      <p>🩺 <strong>Surviving:</strong> running on empty</p>
      <p>🧭 <strong>Drifting:</strong> okay but unfocused</p>
      <p>🌿 <strong>Grounded:</strong> steady and consistent</p>
      <p>🚀 <strong>Growing:</strong> ready to push a little</p>
      <p><strong>Not sure? Start with Drifting.</strong></p>
    </div>
    <div id="compass">
      <button class="surviving" onclick="saveModeChoice('Surviving')">Surviving</button>
      <button class="drifting" onclick="saveModeChoice('Drifting')">Drifting</button>
      <button class="grounded" onclick="saveModeChoice('Grounded')">Grounded</button>
      <button class="growing" onclick="saveModeChoice('Growing')">Growing</button>
    </div>
    <p>Tap a wedge or use the buttons below.</p>
    <div>
      <button onclick="renderMode('Surviving')">🩺 Surviving</button>
      <button onclick="renderMode('Drifting')">🧭 Drifting</button>
      <button onclick="renderMode('Grounded')">🌿 Grounded</button>
      <button onclick="renderMode('Growing')">🚀 Growing</button>
    </div>
    <div id="mode-content"></div>
  `;
}

function renderMode(mode) {
  const container = document.getElementById("mode-content");
  const tools = {
    Surviving: ["Take 3 deep breaths", "Drink a full glass of water", "Write down 1 thing you’re grateful for"],
    Drifting: ["Stretch for 2 minutes", "Set a timer for 10 minutes of focused work", "Tidy up your space"],
    Grounded: ["Go for a 20-minute walk", "Plan your next meal", "Check in with a friend"],
    Growing: ["Push yourself with a workout", "Start a new habit tracker", "Schedule something you’ve been avoiding"]
  };
  const selected = tools[mode];
  container.innerHTML = `
    <h3>${mode} Mode Tools</h3>
    <ul>${selected.map(t => `<li>${t}</li>`).join("")}</ul>
  `;
}

// Quick Wins tab
function renderQuickWins(container) {
  container.innerHTML = `
    <h2>Quick Wins</h2>
    <p>Try these anytime:</p>
    <ul>
      <li>Drink a glass of water</li>
      <li>Step outside for fresh air</li>
      <li>Text a friend “thinking of you”</li>
      <li>Stretch your arms overhead</li>
      <li>Write down one thing that’s working</li>
    </ul>
  `;
}

// History tab
function renderHistory(container) {
  const history = JSON.parse(localStorage.getItem("modeHistory") || "[]");
  const logHtml = history.map(entry => `<p class="mode-entry ${entry.mode.toLowerCase()}">${entry.date}: ${entry.mode}</p>`).join("");
  container.innerHTML = `
    <h2>Your Daily Mode Log</h2>
    ${logHtml || "<p>No history yet.</p>"}
    <p class="stats">🔥 Current Streak: ${getStreak()}</p>
  `;
}

// About tab
function renderAbout(container) {
  container.innerHTML = `
    <h2>About</h2>
    <p>The Reset Compass is a tool to help you check in with your current energy and take small steps toward better health.</p>
    <p>Created by Marcus Clark • Evolution of Wellness LLC</p>
  `;
}

// Data functions
function saveModeChoice(mode) {
  const history = JSON.parse(localStorage.getItem("modeHistory") || "[]");
  const today = new Date().toISOString().slice(0, 10);
  const alreadyLogged = history.find(e => e.date === today);
  if (!alreadyLogged) {
    history.push({ date: today, mode });
    localStorage.setItem("modeHistory", JSON.stringify(history));
  }
  updateStats();
  renderMode(mode);
}

function getTodayMode() {
  const today = new Date().toISOString().slice(0, 10);
  const history = JSON.parse(localStorage.getItem("modeHistory") || "[]");
  const entry = history.find(e => e.date === today);
  return entry ? entry.mode : null;
}

function getStreak() {
  const history = JSON.parse(localStorage.getItem("modeHistory") || "[]").reverse();
  let streak = 0;
  let date = new Date();

  for (let i = 0; i < history.length; i++) {
    const expected = date.toISOString().slice(0, 10);
    if (history[i].date === expected) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function updateStats() {
  const stats = document.querySelector(".stats");
  if (stats) {
    stats.innerHTML = `
      <p>Today: <strong>${getTodayMode() || 0}</strong></p>
      <p>Daily streak: <strong>${getStreak()}</strong></p>
    `;
  }
}
