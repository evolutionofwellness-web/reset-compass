document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("splashScreen").style.display = "none";
    if (!localStorage.getItem("welcomeShown")) {
      document.getElementById("welcomePopup").style.display = "block";
    }
  }, 2000);

  document.getElementById("startButton").addEventListener("click", () => {
    document.getElementById("welcomePopup").style.display = "none";
    localStorage.setItem("welcomeShown", "true");
    renderHome();
  });

  renderHome();
});

function navigate(page) {
  if (page === "home") renderHome();
  if (page === "quickwins") document.getElementById("app").innerHTML = "<h2>Quick Wins Coming Soon!</h2>";
  if (page === "history") document.getElementById("app").innerHTML = "<h2>History Coming Soon!</h2>";
  if (page === "about") document.getElementById("app").innerHTML = "<h2>Built by Evolution of Wellness LLC.</h2>";
}

function renderHome() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="compass">
      <div class="wedge growing" onclick="renderMode('growing')"><span>Growing</span></div>
      <div class="wedge drifting" onclick="renderMode('drifting')"><span>Drifting</span></div>
      <div class="wedge surviving" onclick="renderMode('surviving')"><span>Surviving</span></div>
      <div class="wedge grounded" onclick="renderMode('grounded')"><span>Grounded</span></div>
    </div>
    <div class="mode-buttons">
      <button class="growing" onclick="renderMode('growing')">🚀 Growing Mode</button>
      <button class="drifting" onclick="renderMode('drifting')">🧭 Drifting Mode</button>
      <button class="surviving" onclick="renderMode('surviving')">🩺 Surviving Mode</button>
      <button class="grounded" onclick="renderMode('grounded')">🌿 Grounded Mode</button>
    </div>
  `;
}

function renderMode(mode) {
  const activities = {
    growing: ["Set a bold weekly goal", "Schedule a deep work session", "Teach what you’ve learned"],
    drifting: ["Write one priority on a sticky note", "Pause and breathe for 3 minutes", "Revisit your why"],
    surviving: ["Drink a glass of water", "Stretch for 2 minutes", "Do one thing off your mind"],
    grounded: ["Take a walk without your phone", "Prep a healthy snack", "Unplug from screens for 20 minutes"]
  };

  const list = activities[mode]
    .map((item) => `<li>${item}</li>`)
    .join("");

  document.getElementById("app").innerHTML = `
    <h2>${capitalize(mode)} Mode</h2>
    <ul>${list}</ul>
    <button onclick="renderHome()">← Back</button>
  `;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}