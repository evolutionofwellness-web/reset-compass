window.onload = function () {
  const splash = document.getElementById('splashScreen');
  const welcomePopup = document.getElementById('welcomePopup');
  const startButton = document.getElementById('startButton');

  if (!localStorage.getItem('visited')) {
    welcomePopup.style.display = 'block';
    startButton.onclick = () => {
      welcomePopup.style.display = 'none';
      localStorage.setItem('visited', 'true');
      renderHome();
    };
  } else {
    renderHome();
  }
};

// Navigation
function navigateTo(view) {
  if (view === 'home') renderHome();
  if (view === 'quickWins') renderQuickWins();
  if (view === 'history') renderHistory();
  if (view === 'about') renderAbout();
}

// Views
function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="compass-wrapper">
      <div class="compass-circle">
        <div class="wedge wedge-top" onclick="renderMode('Growing')"><span>Growing</span></div>
        <div class="wedge wedge-right" onclick="renderMode('Drifting')"><span>Drifting</span></div>
        <div class="wedge wedge-bottom" onclick="renderMode('Surviving')"><span>Surviving</span></div>
        <div class="wedge wedge-left" onclick="renderMode('Grounded')"><span>Grounded</span></div>
      </div>
    </div>
    <div class="mode-buttons">
      <button class="mode-btn grow" onclick="renderMode('Growing')">Growing</button>
      <button class="mode-btn drift" onclick="renderMode('Drifting')">Drifting</button>
      <button class="mode-btn surv" onclick="renderMode('Surviving')">Surviving</button>
      <button class="mode-btn ground" onclick="renderMode('Grounded')">Grounded</button>
    </div>
  `;
}

function renderMode(mode) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <h2>${mode} Mode</h2>
    <ul>
      <li>
        <p>Activity 1</p>
        <textarea placeholder="What did you do?"></textarea>
      </li>
      <li>
        <p>Activity 2</p>
        <textarea placeholder="What did you do?"></textarea>
      </li>
      <li>
        <p>Activity 3</p>
        <textarea placeholder="What did you do?"></textarea>
      </li>
    </ul>
    <button onclick="renderHome()">← Back</button>
  `;
}

function renderQuickWins() {
  document.getElementById('app').innerHTML = `<h2>Quick Wins</h2><p>Coming soon...</p>`;
}

function renderHistory() {
  document.getElementById('app').innerHTML = `<h2>History</h2><p>Coming soon...</p>`;
}

function renderAbout() {
  document.getElementById('app').innerHTML = `<h2>About</h2><p>The Reset Compass was created by Evolution of Wellness to help people take small steps toward better health—one mode at a time.</p>`;
}