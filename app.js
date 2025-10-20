// app.js

const routes = {
  "#/home": renderHome,
  "#/wins": renderWins,
  "#/history": renderHistory,
  "#/about": renderAbout,
  "#/mode/1": () => renderMode("Surviving"),
  "#/mode/2": () => renderMode("Drifting"),
  "#/mode/3": () => renderMode("Grounded"),
  "#/mode/4": () => renderMode("Growing"),
};

// Default to home if no hash
if (!location.hash) location.hash = "#/home";

// Load the route
window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);

function router() {
  const view = routes[location.hash];
  if (view) view();
  else renderNotFound();
}

function renderHome() {
  document.getElementById("app").innerHTML = `
    <div class="compass-wrap">
      <svg class="compass" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="98" fill="none" stroke="#1C3B34" stroke-width="4"/>
        <polygon points="100,50 110,100 100,150 90,100" fill="#1C3B34"/>
      </svg>
      <p class="center-tip">Tap a mode to begin.</p>
      <div class="mode-buttons">
        <button class="mode-btn surv" onclick="location.hash='#/mode/1'"><span>Surviving</span></button>
        <button class="mode-btn drift" onclick="location.hash='#/mode/2'"><span>Drifting</span></button>
        <button class="mode-btn ground" onclick="location.hash='#/mode/3'"><span>Grounded</span></button>
        <button class="mode-btn grow" onclick="location.hash='#/mode/4'"><span>Growing</span></button>
      </div>
    </div>
  `;
}

function renderWins() {
  document.getElementById("app").innerHTML = `
    <div class="instructions">
      <h2>Quick Wins</h2>
      <p>These are simple actions you can take right now, even on your worst day.</p>
    </div>
  `;
}

function renderHistory() {
  document.getElementById("app").innerHTML = `
    <div class="instructions">
      <h2>History</h2>
      <p>Your recent activity will appear here.</p>
    </div>
  `;
}

function renderAbout() {
  document.getElementById("app").innerHTML = `
    <div class="instructions">
      <h2>About</h2>
      <p>The Reset Compass was built to help you take one small, meaningful step forward — based on how you feel today.</p>
    </div>
  `;
}

function renderMode(modeName) {
  document.getElementById("app").innerHTML = `
    <div class="instructions">
      <h2>${modeName} Mode</h2>
      <p>This mode gives you guidance that matches your current energy level.</p>
      <button class="btn" onclick="location.hash='#/home'">Back to Compass</button>
    </div>
  `;
}

function renderNotFound() {
  document.getElementById("app").innerHTML = `
    <div class="instructions">
      <h2>Page not found</h2>
      <p>The page you’re looking for doesn’t exist.</p>
    </div>
  `;
}

// Splash screen + First-time Welcome Popup
window.addEventListener('load', () => {
  const splash = document.getElementById('splashScreen');
  const icon = document.getElementById('splashIcon');
  icon?.classList.add('splash-animate');

  setTimeout(() => {
    splash?.style?.display = 'none';

    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      const popup = document.getElementById('welcomePopup');
      popup.style.display = 'flex';
    }
  }, 1600);
});

// Welcome popup dismissal
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startAppBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      localStorage.setItem('hasVisited', 'true');
      const popup = document.getElementById('welcomePopup');
      if (popup) popup.style.display = 'none';
    });
  }
});
