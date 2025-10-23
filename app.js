document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splashScreen');
  const welcomePopup = document.getElementById('welcomePopup');
  const startButton = document.getElementById('startButton');
  const appContent = document.getElementById('appContent');

  // Hide splash after animation
  setTimeout(() => {
    splash.style.display = 'none';

    if (!localStorage.getItem('hasVisited')) {
      welcomePopup.style.display = 'flex';
    } else {
      appContent.style.display = 'block';
      showSection('home');
    }
  }, 1200);

  startButton.addEventListener('click', () => {
    localStorage.setItem('hasVisited', 'true');
    welcomePopup.style.display = 'none';
    appContent.style.display = 'block';
    showSection('home');
  });

  // Compass wedge click
  const wedges = document.querySelectorAll('#compass path');
  wedges.forEach(w => {
    w.addEventListener('click', () => {
      const mode = w.getAttribute('data-mode');
      enterMode(mode);
    });
  });

  // Navigation
  window.navigateTo = function(sectionId) {
    document.querySelectorAll('.section').forEach(sec => {
      sec.style.display = 'none';
    });
    const section = document.getElementById(sectionId + 'Section');
    if (section) section.style.display = 'block';
  };

  // Mode entry
  window.enterMode = function(mode) {
    logModeChoice(mode);
    updateStreak();
    renderModePage(mode);
    showSection('mode');
  };

  function showSection(key) {
    document.querySelectorAll('.section').forEach(sec => {
      sec.style.display = 'none';
    });
    const map = {
      home: 'homeSection',
      quickWins: 'quickWins',
      history: 'historySection',
      about: 'aboutSection',
      mode: 'modeSection',
    };
    document.getElementById(map[key]).style.display = 'block';
  }

  function renderModePage(mode) {
    const title = document.getElementById('modeTitle');
    const list = document.getElementById('activityList');
    const note = document.getElementById('activityNote');
    note.value = '';

    title.textContent = `${mode}`;
    list.innerHTML = '';

    const modeActivities = {
      Growing: [
        "Write a future goal",
        "Celebrate a small win",
        "Take the next step on a project",
      ],
      Drifting: [
        "Name what’s distracting you",
        "Write 1 sentence to refocus",
        "Stand up and reset",
      ],
      Surviving: [
        "Breathe deeply for 1 minute",
        "Drink some water",
        "Choose the next small step",
      ],
      Grounded: [
        "Take a mindful walk",
        "Listen to calming music",
        "Limit screen time for 30 minutes",
      ],
    };

    modeActivities[mode].forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    note.setAttribute('data-mode', mode);
  }

  window.saveActivity = function() {
    const note = document.getElementById('activityNote');
    const mode = note.getAttribute('data-mode');
    const text = note.value.trim();
    if (!text) return;

    const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
    logs.push({ mode, text, date: new Date().toISOString() });
    localStorage.setItem('activityLogs', JSON.stringify(logs));

    note.value = '';
    alert('Saved!');
  };

  function logModeChoice(mode) {
    const log = JSON.parse(localStorage.getItem('modeLog') || '[]');
    const today = new Date().toISOString().split('T')[0];
    log.push({ date: today, mode });
    localStorage.setItem('modeLog', JSON.stringify(log));
  }

  function updateStreak() {
    const log = JSON.parse(localStorage.getItem('modeLog') || '[]');
    let streak = 0;
    let currentDate = new Date();

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (log.find(e => e.date === dateStr)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    document.getElementById('streakCount').textContent = streak;
    renderBreakdown(log);
    renderHistory(log);
  }

  function renderBreakdown(log) {
    const counts = {};
    log.forEach(entry => {
      counts[entry.mode] = (counts[entry.mode] || 0) + 1;
    });

    const total = log.length;
    const container = document.getElementById('modeBreakdown');
    container.innerHTML = '';

    for (const mode in counts) {
      const percent = Math.round((counts[mode] / total) * 100);
      const p = document.createElement('p');
      p.textContent = `${mode}: ${percent}%`;
      container.appendChild(p);
    }
  }

  function renderHistory(log) {
    const container = document.getElementById('modeHistory');
    container.innerHTML = '';
    log.slice().reverse().forEach(entry => {
      const div = document.createElement('div');
      div.textContent = `${entry.date} – ${entry.mode}`;
      container.appendChild(div);
    });
  }

  window.saveQuickWin = function() {
    const input = document.getElementById('quickWinsInput');
    const text = input.value.trim();
    if (!text) return;

    const logs = JSON.parse(localStorage.getItem('quickWinLogs') || '[]');
    logs.push({ text, date: new Date().toISOString() });
    localStorage.setItem('quickWinLogs', JSON.stringify(logs));

    input.value = '';
    alert('Saved!');
  };
});