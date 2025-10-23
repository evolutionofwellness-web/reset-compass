document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splashScreen');
  const welcome = document.getElementById('welcomePopup');
  const app = document.getElementById('appContent');

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

  // Navigation system
  window.navigateTo = function (section) {
    document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
    document.getElementById(section + 'Section').style.display = 'block';
  };

  // Mode click via compass or button
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
    }
  };

  document.querySelectorAll('.mode-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.innerText.split(' ')[1]; // e.g. 🚀 Growing → Growing
      loadMode(mode);
    });
  });

  const compass = document.getElementById('compass');
  if (compass) {
    compass.addEventListener('click', (e) => {
      if (e.target.tagName === 'path' && e.target.dataset.mode) {
        loadMode(e.target.dataset.mode);
      }
    });
  }

  function loadMode(mode) {
    document.getElementById('modeTitle').innerText = `${modeMap[mode].icon} ${mode}`;
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    modeMap[mode].activities.forEach(act => {
      const li = document.createElement('li');
      li.textContent = act;
      activityList.appendChild(li);
    });
    document.getElementById('activityNote').value = '';
    document.getElementById('activityNote').dataset.mode = mode;
    navigateTo('mode');
  }

  window.saveActivity = function () {
    const mode = document.getElementById('activityNote').dataset.mode;
    const note = document.getElementById('activityNote').value.trim();
    const date = new Date().toLocaleDateString();

    let history = JSON.parse(localStorage.getItem('modeHistory') || '[]');
    history.push({ mode, note, date });
    localStorage.setItem('modeHistory', JSON.stringify(history));
    updateHistory();
    calculateStreak();
    navigateTo('history');
  };

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

  // On load
  updateHistory();
  calculateStreak();
});

function saveQuickWin() {
  const input = document.getElementById('quickWinsInput').value.trim();
  if (input) {
    const entry = {
      mode: 'Quick Wins',
      text: input,
      timestamp: new Date().toLocaleString()
    };
    const history = JSON.parse(localStorage.getItem('activityHistory') || '[]');
    history.push(entry);
    localStorage.setItem('activityHistory', JSON.stringify(history));
    document.getElementById('quickWinsInput').value = '';
    alert('Saved!');
  }
}