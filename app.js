document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splashScreen');
  const welcome = document.getElementById('welcomePopup');
  const app = document.getElementById('appContent');

  // Splash and welcome logic
  setTimeout(() => {
    splash.style.display = 'none';
    if (!localStorage.getItem('hasSeenPopup')) {
      welcome.style.display = 'block';
    } else {
      app.style.display = 'block';
      navigateTo('home');
    }
  }, 2000);

  document.getElementById('startButton').addEventListener('click', () => {
    localStorage.setItem('hasSeenPopup', 'true');
    welcome.style.display = 'none';
    app.style.display = 'block';
    navigateTo('home');
  });

  // Navigation
  window.navigateTo = function (section) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    document.getElementById(section + 'Section')?.style.display = 'block';
    document.getElementById(section)?.style.display = 'block';
  };

  // Activity content map
  const modeMap = {
    Growing: {
      icon: '🚀',
      activities: ['Write a future goal', 'Celebrate a small win', 'Take the next step on a project']
    },
    Drifting: {
      icon: '🧭',
      activities: ['Name what’s distracting you', 'Write 1 sentence to refocus', 'Stand up and reset']
    },
    Surviving: {
      icon: '🩺',
      activities: ['Take 3 deep breaths', 'Text someone for support', 'Eat a small nourishing snack']
    },
    Grounded: {
      icon: '🌱',
      activities: ['Sit in silence for 1 minute', 'Journal 2 thoughts', 'Walk without your phone']
    },
    QuickWins: {
      icon: '⚡',
      activities: ['Take 3 deep breaths', 'Stretch for 1 minute', 'Drink a full glass of water']
    }
  };

  // Mode buttons + compass
  document.querySelectorAll('.mode-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.innerText.split(' ')[1];
      loadMode(mode);
    });
  });

  const compass = document.getElementById('compass');
  if (compass) {
    compass.addEventListener('click', (e) => {
      if (e.target.tagName === 'path' && e.target.dataset.mode) {
        const mode = capitalize(e.target.dataset.mode);
        loadMode(mode);
      }
    });
  }

  function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function loadMode(mode) {
    document.getElementById('modeTitle').innerText = `${modeMap[mode].icon} ${mode}`;
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';

    modeMap[mode].activities.forEach((act, index) => {
      const block = document.createElement('div');
      block.className = 'activity-block';
      block.innerHTML = `
        <li>${act}</li>
        <textarea data-mode="${mode}" data-index="${index}" placeholder="Write what you did..."></textarea>
        <button onclick="saveActivity('${mode}', ${index})">Save</button>
      `;
      activityList.appendChild(block);
    });

    navigateTo('mode');
  }

  // Save activity
  window.saveActivity = function (mode, index) {
    const textarea = document.querySelector(`textarea[data-mode="${mode}"][data-index="${index}"]`);
    if (!textarea) return;
    const note = textarea.value.trim();
    if (!note) return;

    const date = new Date().toLocaleDateString();
    const entry = { mode, note, date };

    let history = JSON.parse(localStorage.getItem('modeHistory') || '[]');
    history.push(entry);
    localStorage.setItem('modeHistory', JSON.stringify(history));

    updateHistory();
    calculateStreak();
    navigateTo('history');
  };

  // Save quick win
  window.saveQuickWin = function (index) {
    const textarea = document.querySelector(`#quickWins textarea[data-index="${index}"]`);
    const input = textarea?.value.trim();
    if (!input) return;

    const entry = {
      mode: 'Quick Wins',
      note: input,
      date: new Date().toLocaleDateString()
    };

    let history = JSON.parse(localStorage.getItem('modeHistory') || '[]');
    history.push(entry);
    localStorage.setItem('modeHistory', JSON.stringify(history));

    updateHistory();
    calculateStreak();
    navigateTo('history');
  };

  // Render quick wins on load
  function renderQuickWins() {
    const section = document.getElementById('quickWins');
    const ul = section.querySelector('ul');
    ul.innerHTML = '';

    modeMap.QuickWins.activities.forEach((item, index) => {
      const block = document.createElement('div');
      block.className = 'activity-block';
      block.innerHTML = `
        <li>${item}</li>
        <textarea data-index="${index}" placeholder="Write what you did..."></textarea>
        <button onclick="saveQuickWin(${index})">Save</button>
      `;
      ul.appendChild(block);
    });
  }

  // History
  function updateHistory() {
    const container = document.getElementById('modeHistory');
    const breakdown = document.getElementById('modeBreakdown');
    const history = JSON.parse(localStorage.getItem('modeHistory') || '[]');

    container.innerHTML = '';
    breakdown.innerHTML = '';

    if (history.length === 0) {
      container.innerHTML = '<p>No history yet.</p>';
      return;
    }

    const modeCounts = {};
    history.forEach(entry => {
      const div = document.createElement('div');
      div.innerHTML = `<strong>${entry.date}:</strong> ${entry.mode} — ${entry.note}`;
      container.appendChild(div);
      modeCounts[entry.mode] = (modeCounts[entry.mode] || 0) + 1;
    });

    const total = history.length;
    for (let mode in modeCounts) {
      const percent = ((modeCounts[mode] / total) * 100).toFixed(0);
      const p = document.createElement('p');
      p.textContent = `${mode}: ${percent}%`;
      breakdown.appendChild(p);
    }
  }

  // Streak
  function calculateStreak() {
    const history = JSON.parse(localStorage.getItem('modeHistory') || '[]');
    if (history.length === 0) {
      document.getElementById('streakCount').innerText = 0;
      return;
    }

    let streak = 1;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = history.length - 2; i >= 0; i--) {
      const date = new Date(history[i].date);
      date.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(expected.getDate() - streak);

      if (date.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    document.getElementById('streakCount').innerText = streak;
  }

  // Initialize
  renderQuickWins();
  updateHistory();
  calculateStreak();
});