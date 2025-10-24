document.addEventListener('DOMContentLoaded', () => {
  // Splash screen
  const splash = document.getElementById('splashScreen');
  setTimeout(() => {
    splash.style.display = 'none';
    checkWelcomePopup();
  }, 2300);

  // Welcome popup logic
  function checkWelcomePopup() {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      document.getElementById('welcomeModal').style.display = 'flex';
    }
  }

  document.getElementById('closeWelcome').onclick = () => {
    document.getElementById('welcomeModal').style.display = 'none';
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  // Navigation buttons
  document.getElementById('homeBtn').onclick = () => showSection('home');
  document.getElementById('quickWinsBtn').onclick = () => showSection('quickWins');
  document.getElementById('historyBtn').onclick = () => renderHistory();
  document.getElementById('aboutBtn').onclick = () => showSection('about');

  function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
  }

  // Streak tracking
  function getToday() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  function updateStreak() {
    const history = JSON.parse(localStorage.getItem('activityHistory') || '[]');
    if (history.length === 0) {
      document.getElementById('streakDisplay').innerText = 'Daily Streak: 0';
      return;
    }

    let streak = 1;
    const today = new Date(getToday());
    for (let i = history.length - 2; i >= 0; i--) {
      const current = new Date(history[i].date);
      const next = new Date(history[i + 1].date);
      const diff = (next - current) / (1000 * 3600 * 24);

      if (diff === 86400000) {
        streak++;
      } else {
        break;
      }
    }
    document.getElementById('streakDisplay').innerText = `Daily Streak: ${streak}`;
  }

  // Render history
  function renderHistory() {
    showSection('history');
    const history = JSON.parse(localStorage.getItem('activityHistory') || '[]');
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    history.slice().reverse().forEach(entry => {
      const li = document.createElement('li');
      li.innerText = `${entry.date} — ${entry.mode}: ${entry.activity}`;
      list.appendChild(li);
    });
    updateStreak();
  }

  // Save activity
  function saveActivity(mode, text) {
    const date = getToday();
    let history = JSON.parse(localStorage.getItem('activityHistory') || '[]');
    if (!history.find(entry => entry.date === date && entry.mode === mode && entry.activity === text)) {
      history.push({ date, mode, activity: text });
      localStorage.setItem('activityHistory', JSON.stringify(history));
    }
    updateStreak();
  }

  // Mode buttons
  const modes = ['growing', 'grounded', 'drifting', 'surviving'];
  modes.forEach(mode => {
    document.getElementById(`${mode}Btn`).onclick = () => renderMode(mode);
  });

  // Compass wedge clicks
  document.querySelectorAll('.wedge').forEach(wedge => {
    wedge.addEventListener('click', () => {
      const mode = wedge.getAttribute('data-mode');
      renderMode(mode);
    });
  });

  // Render mode pages
  function renderMode(mode) {
    showSection('modePage');
    const container = document.getElementById('modeContent');
    container.innerHTML = '';
    const title = mode.charAt(0).toUpperCase() + mode.slice(1);
    const activities = {
      growing: ['Learn something new', 'Challenge yourself', 'Help someone grow'],
      grounded: ['Stretch or breathe', 'Take a walk', 'Eat a solid meal'],
      drifting: ['Notice your emotions', 'Do a reset routine', 'Set a 5-min timer'],
      surviving: ['Get out of bed', 'Drink water', 'Ask for help']
    }[mode];

    const colorMap = {
      growing: 'var(--growing-color)',
      grounded: 'var(--grounded-color)',
      drifting: 'var(--drifting-color)',
      surviving: 'var(--surviving-color)'
    };

    const h2 = document.createElement('h2');
    h2.innerText = `${title} Mode`;
    container.appendChild(h2);

    activities.forEach((activity, index) => {
      const div = document.createElement('div');
      div.style.marginBottom = '16px';

      const label = document.createElement('label');
      label.innerText = `${activity}:`;
      label.style.fontWeight = 'bold';

      const textarea = document.createElement('textarea');
      textarea.placeholder = `Write how you'll do this today...`;
      textarea.rows = 3;
      textarea.onblur = () => saveActivity(mode, textarea.value);

      div.appendChild(label);
      div.appendChild(textarea);
      container.appendChild(div);
    });

    container.style.backgroundColor = colorMap[mode];
    container.style.padding = '20px';
    container.style.borderRadius = '12px';
  }

  // Quick wins
  const quickWins = [
    'Drink water right now',
    'Take 5 deep breaths',
    'Stretch your neck or shoulders',
    'Delete one distraction app',
    'Stand up and move for 1 min'
  ];

  const list = document.getElementById('quickWinsList');
  quickWins.forEach(qw => {
    const li = document.createElement('li');
    const label = document.createElement('label');
    label.innerText = qw;
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'How did it help?';
    textarea.rows = 2;
    textarea.onblur = () => saveActivity('quick win', textarea.value);
    li.appendChild(label);
    li.appendChild(textarea);
    list.appendChild(li);
  });

  updateStreak();
  showSection('home');
});