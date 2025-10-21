// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js?v=1.0.6').then(function(reg) {
    console.log('Service Worker registered:', reg);
  }).catch(function(error) {
    console.log('Service Worker registration failed:', error);
  });
}

// Splash Screen + Welcome Popup
document.addEventListener('DOMContentLoaded', function () {
  const splashScreen = document.getElementById('splash-screen');
  const welcomePopup = document.getElementById('welcomePopup');
  const startButton = document.getElementById('startButton');

  // Show splash screen, then welcome popup (once only)
  splashScreen.style.display = 'flex';
  setTimeout(() => {
    splashScreen.classList.add('fade-out');
    setTimeout(() => {
      splashScreen.style.display = 'none';
      if (!localStorage.getItem('welcomeShown')) {
        welcomePopup.style.display = 'flex';
      }
    }, 1000);
  }, 2000);

  // Hide popup on "Let’s Start"
  startButton.addEventListener('click', () => {
    welcomePopup.style.display = 'none';
    localStorage.setItem('welcomeShown', 'true');
  });

  renderCompass();
  renderButtons();
  renderStats();
  renderHistory();
});

// Mode Data
const modes = [
  { name: 'Growing', emoji: '🚀', color: '#3b82f6' },
  { name: 'Surviving', emoji: '🩺', color: '#b91c1c' },
  { name: 'Grounded', emoji: '🌿', color: '#15803d' },
  { name: 'Drifting', emoji: '🧭', color: '#7c3aed' }
];

// Render Compass
function renderCompass() {
  const compass = document.getElementById('compass');
  compass.innerHTML = '';
  const wedgeCount = modes.length;

  modes.forEach((mode, i) => {
    const wedge = document.createElement('div');
    wedge.className = 'wedge';
    wedge.style.background = mode.color;

    const angle = 360 / wedgeCount;
    wedge.style.transform = `rotate(${angle * i}deg) skewY(-60deg)`;

    const content = document.createElement('div');
    content.className = 'wedge-content';
    content.style.transform = `skewY(60deg) rotate(-${angle * i}deg)`;

    content.innerHTML = `<span>${mode.emoji}</span><br><strong>${mode.name}</strong>`;
    wedge.appendChild(content);

    wedge.addEventListener('click', () => logMode(mode.name));
    compass.appendChild(wedge);
  });
}

// Render Buttons
function renderButtons() {
  const container = document.getElementById('mode-buttons');
  container.innerHTML = '';
  modes.forEach((mode) => {
    const btn = document.createElement('button');
    btn.textContent = mode.name;
    btn.onclick = () => logMode(mode.name);
    container.appendChild(btn);
  });
}

// Log Mode
function logMode(modeName) {
  const today = new Date().toISOString().split('T')[0];
  let log = JSON.parse(localStorage.getItem('modeLog') || '{}');
  log[today] = modeName;
  localStorage.setItem('modeLog', JSON.stringify(log));
  renderStats();
  renderHistory();
}

// Render Stats
function renderStats() {
  const stats = document.getElementById('stats');
  const log = JSON.parse(localStorage.getItem('modeLog') || '{}');
  const days = Object.keys(log).sort().reverse();

  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const expected = date.toISOString().split('T')[0];
    if (log[expected]) {
      streak++;
    } else {
      break;
    }
  }

  stats.innerHTML = `🔥 <strong>${streak}</strong> day streak`;
}

// Render History
function renderHistory() {
  const history = document.getElementById('history');
  const log = JSON.parse(localStorage.getItem('modeLog') || '{}');
  const days = Object.keys(log).sort().reverse();

  history.innerHTML = '';
  days.forEach(date => {
    const entry = document.createElement('div');
    entry.className = 'history-entry';
    const mode = modes.find(m => m.name === log[date]);
    entry.innerHTML = `<span>${date}:</span> ${mode.emoji} <strong>${mode.name}</strong>`;
    history.appendChild(entry);
  });
}
