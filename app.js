// Splash screen logic
window.addEventListener('load', () => {
  const splash = document.getElementById('splashScreen');
  const icon = document.getElementById('splashIcon');
  if (splash && icon) {
    icon.classList.add('splash-animate');
    setTimeout(() => {
      splash.style.display = 'none';
    }, 1600); // Match the animation duration
  }
});

// Welcome popup (first time only)
document.addEventListener('DOMContentLoaded', () => {
  const welcomeShown = localStorage.getItem('welcomeShown');
  const welcomePopup = document.getElementById('welcomePopup');
  const startBtn = document.getElementById('startAppBtn');

  if (!welcomeShown && welcomePopup && startBtn) {
    welcomePopup.style.display = 'flex';
    startBtn.addEventListener('click', () => {
      welcomePopup.style.display = 'none';
      localStorage.setItem('welcomeShown', 'true');
    });
  } else if (welcomePopup) {
    welcomePopup.remove(); // Prevent hidden message from taking space
  }
});

// Mode activities
const modeData = {
  surv: ["Breathe deeply for 2 minutes", "Drink a glass of water", "Text a friend for support"],
  drift: ["Go for a 5-minute walk", "Do a light stretch", "Jot down how you're feeling"],
  ground: ["Do a focused task for 10 minutes", "Prepare a healthy snack", "Clean one small area"],
  grow: ["Write 3 goals for the day", "Do 10 push-ups", "Reflect on a recent win"]
};

function showModeActivities(mode) {
  const container = document.getElementById('modeActivities');
  if (!container) return;
  container.innerHTML = ''; // Clear previous

  const items = modeData[mode] || [];
  items.forEach(text => {
    const div = document.createElement('div');
    div.className = 'mode-activity';
    div.textContent = text;
    container.appendChild(div);
  });

  saveModeChoice(mode);
}

// Logging mode choice
function saveModeChoice(mode) {
  const today = new Date().toISOString().slice(0, 10);
  let log = JSON.parse(localStorage.getItem('modeLog') || '{}');
  log[today] = mode;
  localStorage.setItem('modeLog', JSON.stringify(log));
  updateHistory();
  updateStreak(log);
  updateModeBreakdown(log);
}

// History display
function updateHistory() {
  const log = JSON.parse(localStorage.getItem('modeLog') || '{}');
  const history = document.getElementById('mode-history');
  if (!history) return;

  history.innerHTML = '';
  const entries = Object.entries(log).reverse();

  entries.forEach(([date, mode]) => {
    const entry = document.createElement('div');
    entry.className = 'mode-log-entry';
    entry.style.borderLeftColor = `var(--${mode})`;
    entry.textContent = `${date}: ${mode.toUpperCase()}`;
    history.appendChild(entry);
  });
}

// Streak counter
function updateStreak(log) {
  const streakEl = document.getElementById('streak');
  if (!streakEl) return;

  let streak = 0;
  let date = new Date();

  while (true) {
    const key = date.toISOString().slice(0, 10);
    if (log[key]) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  streakEl.innerHTML = `<strong>🔥 ${streak} Day Streak</strong>`;
}

// Mode usage breakdown
function updateModeBreakdown(log) {
  const el = document.getElementById('mode-breakdown');
  if (!el) return;

  const counts = { surv: 0, drift: 0, ground: 0, grow: 0 };
  Object.values(log).forEach(mode => {
    if (counts[mode] !== undefined) counts[mode]++;
  });

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  el.innerHTML = `<strong>Mode Usage Breakdown:</strong><br>`;
  for (const [mode, count] of Object.entries(counts)) {
    const percent = total ? Math.round((count / total) * 100) : 0;
    el.innerHTML += `${mode.toUpperCase()}: ${percent}%<br>`;
  }
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('.mode-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      showModeActivities(mode);
    });
  });

  updateHistory();
});
