// === SPLASH SCREEN ===
window.addEventListener('load', () => {
  const splash = document.getElementById('splashScreen');
  const app = document.getElementById('app');

  if (splash && app) {
    setTimeout(() => {
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.remove();
        app.style.display = 'block';
      }, 600);
    }, 1000);
  }
});

// === FIRST-TIME WELCOME POPUP ===
document.addEventListener('DOMContentLoaded', () => {
  const hasVisited = localStorage.getItem('hasVisited');
  const welcomePopup = document.getElementById('welcomePopup');
  const startBtn = document.getElementById('startButton');

  if (!hasVisited && welcomePopup && startBtn) {
    welcomePopup.style.display = 'flex';
    startBtn.addEventListener('click', () => {
      localStorage.setItem('hasVisited', 'true');
      welcomePopup.style.display = 'none';
    });
  }
});

// === MODE COLOR MAPPING ===
const modeColors = {
  surviving: '#A94747',
  drifting: '#E6B450',
  grounded: '#3B755F',
  growing: '#4C7EDC'
};

const modeIcons = {
  surviving: '🩺',
  drifting: '🧭',
  grounded: '🌿',
  growing: '🚀'
};

// === ACTIVITY DATA ===
const modeActivities = {
  surviving: ['Take 3 deep breaths', 'Drink water', 'Stretch for 1 min'],
  drifting: ['Put phone away', 'Walk outside', 'Write down 1 thing you’re grateful for'],
  grounded: ['Plan tomorrow', 'Eat a full meal', 'Do a real workout'],
  growing: ['Reach out to someone', 'Try a challenge', 'Learn something new']
};

// === RENDER COMPASS & BUTTONS ===
function renderCompass() {
  const compass = document.getElementById('compass');
  const buttons = document.getElementById('modeButtons');
  const modes = ['growing', 'surviving', 'grounded', 'drifting'];

  if (!compass || !buttons) return;

  compass.innerHTML = '';
  modes.forEach((mode, i) => {
    const wedge = document.createElement('div');
    wedge.className = 'wedge';
    wedge.style.backgroundColor = modeColors[mode];
    wedge.style.transform = `rotate(${i * 90}deg)`;

    const label = document.createElement('div');
    label.innerHTML = `${modeIcons[mode]} <br><strong>${capitalize(mode)}</strong>`;
    label.style.transform = `rotate(-${i * 90}deg)`;
    label.style.textAlign = 'center';
    wedge.appendChild(label);

    wedge.addEventListener('click', () => showMode(mode));
    compass.appendChild(wedge);
  });

  buttons.innerHTML = '';
  modes.forEach(mode => {
    const btn = document.createElement('button');
    btn.className = `mode-btn ${mode}`;
    btn.textContent = capitalize(mode);
    btn.addEventListener('click', () => showMode(mode));
    buttons.appendChild(btn);
  });
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// === SHOW MODE ACTIVITIES ===
function showMode(mode) {
  const section = document.getElementById('modeView');
  const title = document.getElementById('modeTitle');
  const list = document.getElementById('modeActivities');
  const logBtn = document.getElementById('logButton');

  if (!section || !title || !list || !logBtn) return;

  title.textContent = capitalize(mode);
  section.style.display = 'block';
  list.innerHTML = '';
  modeActivities[mode].forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });

  logBtn.onclick = () => {
    saveModeChoice(mode);
    alert(`Logged as "${capitalize(mode)}" for today`);
  };
}

// === SAVE MODE + UPDATE STREAK ===
function saveModeChoice(mode) {
  const today = new Date().toISOString().split('T')[0];
  const log = JSON.parse(localStorage.getItem('modeLog') || '{}');
  log[today] = mode;
  localStorage.setItem('modeLog', JSON.stringify(log));
  updateStreak(log);
  updateHistory(log);
}

// === STREAK LOGIC ===
function updateStreak(log = null) {
  const streakDisplay = document.getElementById('streakCount');
  if (!streakDisplay) return;

  if (!log) log = JSON.parse(localStorage.getItem('modeLog') || '{}');
  const dates = Object.keys(log).sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  let currentDate = new Date();

  for (const date of dates) {
    const logDate = new Date(date);
    if (
      logDate.getFullYear() === currentDate.getFullYear() &&
      logDate.getMonth() === currentDate.getMonth() &&
      logDate.getDate() === currentDate.getDate()
    ) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  streakDisplay.textContent = `🔥 ${streak}`;
}

// === HISTORY PANEL ===
function updateHistory(log = null) {
  const container = document.getElementById('historyLog');
  if (!container) return;
  if (!log) log = JSON.parse(localStorage.getItem('modeLog') || '{}');

  container.innerHTML = '';
  Object.entries(log).reverse().forEach(([date, mode]) => {
    const div = document.createElement('div');
    div.className = 'mode-entry';
    div.textContent = `${date}: ${capitalize(mode)}`;
    div.style.borderLeft = `4px solid ${modeColors[mode]}`;
    container.appendChild(div);
  });
}

// === SIMPLE NAVIGATION ===
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => {
    sec.style.display = 'none';
  });

  const target = document.getElementById(sectionId);
  if (target) target.style.display = 'block';
}

// === INIT APP ===
document.addEventListener('DOMContentLoaded', () => {
  renderCompass();
  updateStreak();
  updateHistory();
  showSection('home');
});
