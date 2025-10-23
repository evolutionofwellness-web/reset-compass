document.addEventListener('DOMContentLoaded', () => {
  // Splash screen logic
  const splash = document.getElementById('splashScreen');
  if (splash) {
    setTimeout(() => {
      splash.style.display = 'none';
      showWelcomePopup();
    }, 2000);
  }

  function showWelcomePopup() {
    const popup = document.getElementById('welcomePopup');
    const appContent = document.getElementById('appContent');
    if (!localStorage.getItem('hasSeenPopup')) {
      popup.style.display = 'block';
    } else {
      appContent.style.display = 'block';
    }
  }

  const startButton = document.getElementById('startButton');
  if (startButton) {
    startButton.addEventListener('click', () => {
      localStorage.setItem('hasSeenPopup', 'true');
      document.getElementById('welcomePopup').style.display = 'none';
      document.getElementById('appContent').style.display = 'block';
    });
  }

  // Navigation buttons
  document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      document.querySelectorAll('section').forEach(sec => sec.style.display = 'none');
      document.getElementById(targetId).style.display = 'block';
    });
  });

  // Mode mapping and activities
  const modeMap = {
    growing: {
      name: '🚀 Growing',
      color: '#3498db',
      description: "You're energized and ready to make progress.",
      activities: [
        'Tackle your hardest task first',
        'Journal a win from yesterday',
        'Move your body for 20+ minutes'
      ]
    },
    drifting: {
      name: '🧭 Drifting',
      color: '#f1c40f',
      description: "You feel a little off track or distracted.",
      activities: [
        'Turn off notifications for 30 minutes',
        'Write down your top 1–2 priorities',
        'Go for a short walk without your phone'
      ]
    },
    surviving: {
      name: '🩺 Surviving',
      color: '#e74c3c',
      description: "You’re overwhelmed or barely making it through.",
      activities: [
        'Eat something nourishing',
        'Step outside and breathe',
        'Cancel a non-essential task'
      ]
    },
    grounded: {
      name: '🌿 Grounded',
      color: '#2ecc71',
      description: "You feel calm and steady today.",
      activities: [
        'Do something kind for your future self',
        'Drink water and stretch',
        'Send a supportive message to someone'
      ]
    }
  };

  const compass = document.getElementById('compass');
  if (compass) {
    compass.addEventListener('click', (e) => {
      if (e.target.tagName === 'path' && e.target.dataset.mode) {
        const mode = e.target.dataset.mode;
        loadMode(mode);
      }
    });
  }

  // Button click support
  const modeButtons = document.querySelectorAll('.mode-button');
  if (modeButtons.length) {
    modeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.innerText.toLowerCase().includes('growing') ? 'growing'
                    : button.innerText.toLowerCase().includes('drifting') ? 'drifting'
                    : button.innerText.toLowerCase().includes('surviving') ? 'surviving'
                    : 'grounded';
        loadMode(mode);
      });
    });
  }

  function loadMode(mode) {
    const modeData = modeMap[mode];
    if (!modeData) return;

    document.querySelectorAll('section').forEach(sec => sec.style.display = 'none');
    document.getElementById('modeSection').style.display = 'block';

    document.getElementById('selectedModeName').innerText = modeData.name;
    document.getElementById('selectedModeDescription').innerText = modeData.description;

    const list = document.getElementById('modeActivitiesList');
    list.innerHTML = '';
    modeData.activities.forEach(activity => {
      const li = document.createElement('li');
      li.innerText = activity;
      list.appendChild(li);
    });

    document.getElementById('saveActivityButton').onclick = () => {
      const note = document.getElementById('activityNote').value.trim();
      if (note) {
        saveToHistory(mode, note);
        document.getElementById('activityNote').value = '';
        alert('Activity saved!');
      } else {
        alert('Please enter what you did.');
      }
    };

    incrementStreak();
  }

  function saveToHistory(mode, note) {
    const entry = {
      mode,
      note,
      date: new Date().toLocaleString()
    };

    const history = JSON.parse(localStorage.getItem('activityHistory') || '[]');
    history.unshift(entry);
    localStorage.setItem('activityHistory', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    const history = JSON.parse(localStorage.getItem('activityHistory') || '[]');
    const container = document.getElementById('mode-history');
    const breakdown = document.getElementById('modeBreakdownList');
    container.innerHTML = '';
    breakdown.innerHTML = '';

    const countMap = {};
    history.forEach(entry => {
      const div = document.createElement('div');
      div.innerHTML = `<strong>${modeMap[entry.mode]?.name || entry.mode}</strong>: ${entry.note} <em>(${entry.date})</em>`;
      container.appendChild(div);

      countMap[entry.mode] = (countMap[entry.mode] || 0) + 1;
    });

    const total = history.length;
    for (let mode in countMap) {
      const percent = ((countMap[mode] / total) * 100).toFixed(1);
      const li = document.createElement('li');
      li.innerText = `${modeMap[mode]?.name || mode}: ${percent}%`;
      breakdown.appendChild(li);
    }
  }

  function incrementStreak() {
    const today = new Date().toDateString();
    const last = localStorage.getItem('lastStreakDate');
    let streak = parseInt(localStorage.getItem('streak') || '0');

    if (last !== today) {
      streak++;
      localStorage.setItem('streak', streak);
      localStorage.setItem('lastStreakDate', today);
    }

    document.getElementById('streakCount').innerText = streak;
  }

  renderHistory(); // Call on load
});