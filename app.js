// Splash & Welcome Popup
window.addEventListener('load', () => {
  const hasVisited = localStorage.getItem('visited');
  const splash = document.getElementById('splashScreen');
  const popup = document.getElementById('welcomePopup');

  setTimeout(() => {
    splash.style.display = 'none';
    if (!hasVisited) {
      popup.style.display = 'flex';
    }
  }, 1600);
});

document.getElementById('startButton').addEventListener('click', () => {
  document.getElementById('welcomePopup').style.display = 'none';
  localStorage.setItem('visited', 'true');
});

// Navigation
const sections = ['homeSection', 'quickWinsSection', 'historySection', 'aboutSection'];
function showSection(id) {
  sections.forEach(section => {
    document.getElementById(section).classList.toggle('active-section', section === id);
    document.getElementById(section).classList.toggle('hidden-section', section !== id);
  });
}

document.querySelectorAll('nav button').forEach(button => {
  button.addEventListener('click', () => {
    showSection(button.getAttribute('data-target'));
  });
});

// Compass + Mode Buttons
const modeColors = {
  Growing: 'blue',
  Grounded: 'green',
  Drifting: 'yellow',
  Surviving: 'red'
};

const modes = Object.keys(modeColors);

// Routing to Mode Pages
function goToMode(mode) {
  const sectionId = `${mode.toLowerCase()}Mode`;
  showSection(sectionId);
  saveModeChoice(mode);
}

// Compass Wedges
modes.forEach(mode => {
  const wedge = document.getElementById(`${mode.toLowerCase()}Wedge`);
  if (wedge) {
    wedge.addEventListener('click', () => goToMode(mode));
  }
});

// Mode Buttons
document.querySelectorAll('.mode-buttons button').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.textContent.trim();
    goToMode(mode);
  });
});

// Save User Input per Activity
document.querySelectorAll('textarea').forEach(textarea => {
  textarea.addEventListener('change', () => {
    const key = textarea.getAttribute('data-key');
    localStorage.setItem(key, textarea.value);
  });
});

// Load Saved Inputs
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('textarea').forEach(textarea => {
    const key = textarea.getAttribute('data-key');
    textarea.value = localStorage.getItem(key) || '';
  });
  renderHistory();
  renderStreak();
});

// Logging + History
function saveModeChoice(mode) {
  const dateKey = new Date().toISOString().slice(0, 10);
  localStorage.setItem(`log-${dateKey}`, mode);
  renderHistory();
  renderStreak();
}

function renderHistory() {
  const historyList = document.getElementById('mode-history');
  historyList.innerHTML = '';

  const logs = Object.keys(localStorage)
    .filter(key => key.startsWith('log-'))
    .sort()
    .reverse();

  logs.forEach(key => {
    const date = key.replace('log-', '');
    const mode = localStorage.getItem(key);
    const color = modeColors[mode] || 'gray';

    const li = document.createElement('li');
    li.style.borderLeft = `6px solid ${color}`;
    li.textContent = `${date}: ${mode}`;
    historyList.appendChild(li);
  });

  // Breakdown
  const counts = {};
  modes.forEach(mode => counts[mode] = 0);
  logs.forEach(key => {
    const mode = localStorage.getItem(key);
    if (counts[mode] !== undefined) counts[mode]++;
  });

  const breakdown = document.getElementById('mode-breakdown');
  const total = logs.length;
  breakdown.innerHTML = modes.map(mode => {
    const percent = total > 0 ? ((counts[mode] / total) * 100).toFixed(1) : 0;
    return `<div><strong>${mode}:</strong> ${percent}%</div>`;
  }).join('');
}

// Daily Streak
function renderStreak() {
  const logs = Object.keys(localStorage)
    .filter(k => k.startsWith('log-'))
    .sort()
    .reverse();

  if (logs.length === 0) return document.getElementById('dailyStreak').textContent = '';

  let streak = 1;
  const today = new Date();
  for (let i = 1; i < logs.length; i++) {
    const prevDate = new Date(logs[i].replace('log-', ''));
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (prevDate.toDateString() === expected.toDateString()) {
      streak++;
    } else {
      break;
    }
  }

  document.getElementById('dailyStreak').textContent = `🔥 Daily Streak: ${streak} day${streak > 1 ? 's' : ''}`;
}