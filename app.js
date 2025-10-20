// === Splash Screen Logic ===
window.addEventListener('load', () => {
  const splash = document.getElementById('splashScreen');
  const appContent = document.getElementById('app');

  if (splash && appContent) {
    setTimeout(() => {
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
        appContent.style.display = 'block';
      }, 600);
    }, 1000);
  }
});

// === First-Time Welcome Popup ===
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
  } else if (welcomePopup) {
    welcomePopup.style.display = 'none';
  }
});

// === Mode Colors ===
const modeColors = {
  surviving: '#A83232',
  drifting: '#E6B339',
  grounded: '#2F6B4F',
  growing: '#3B6EEA'
};

// === Apply Wedge Colors + Text Contrast ===
function renderCompass() {
  const compass = document.getElementById('compass');
  if (!compass) return;

  const wedgeNames = ['growing', 'surviving', 'grounded', 'drifting'];
  const wedgeElements = compass.querySelectorAll('.wedge');

  wedgeElements.forEach((wedge, index) => {
    const mode = wedgeNames[index];
    wedge.style.backgroundColor = modeColors[mode];
    wedge.style.color = '#fff';
  });
}

// === Handle Mode Selection ===
function selectMode(mode) {
  if (!mode) return;
  saveModeChoice(mode);
  showToolsForMode(mode);
  renderStats(); // Optional if you want real-time refresh
}

// === Save to Local Storage ===
function saveModeChoice(mode) {
  const today = new Date().toISOString().split('T')[0];
  const log = JSON.parse(localStorage.getItem('modeLog') || '{}');
  log[today] = mode;
  localStorage.setItem('modeLog', JSON.stringify(log));
  updateStreak(log);
  updateHistoryDisplay(log);
}

// === Streak Calculation ===
function updateStreak(log) {
  const dates = Object.keys(log).sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  let currentDate = new Date();

  for (let date of dates) {
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

  document.getElementById('streakCount').textContent = streak;
}

// === Update Mode History Panel ===
function updateHistoryDisplay(log) {
  const container = document.getElementById('mode-history');
  if (!container) return;

  container.innerHTML = '';
  Object.entries(log).reverse().forEach(([date, mode]) => {
    const entry = document.createElement('div');
    entry.className = 'mode-entry';
    entry.textContent = `${date}: ${mode}`;
    entry.style.borderLeft = `4px solid ${modeColors[mode]}`;
    container.appendChild(entry);
  });
}

// === Simple Tab Navigation Logic ===
function showSection(sectionId) {
  const sections = document.querySelectorAll('.section');
  sections.forEach(sec => sec.style.display = 'none');

  const target = document.getElementById(sectionId);
  if (target) target.style.display = 'block';
}

// === Init App on Load ===
document.addEventListener('DOMContentLoaded', () => {
  renderCompass();
  const storedLog = JSON.parse(localStorage.getItem('modeLog') || '{}');
  updateStreak(storedLog);
  updateHistoryDisplay(storedLog);
});
