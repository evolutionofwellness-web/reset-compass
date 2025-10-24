// Wait for DOM content
document.addEventListener('DOMContentLoaded', () => {
  const splashScreen = document.getElementById('splashScreen');
  const welcomeModal = document.getElementById('welcomeModal');
  const startAppButton = document.getElementById('startApp');
  const appWrapper = document.getElementById('appWrapper');

  // Show welcome modal only if not seen
  if (!localStorage.getItem('hasVisited')) {
    welcomeModal.classList.remove('hidden');
  } else {
    appWrapper.classList.remove('hidden');
  }

  // Handle start button
  startAppButton.addEventListener('click', () => {
    welcomeModal.classList.add('hidden');
    appWrapper.classList.remove('hidden');
    localStorage.setItem('hasVisited', 'true');
  });

  // Navigation
  window.navigate = (viewId) => {
    document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    if (viewId === 'historyView') renderHistory();
    if (viewId === 'quickWinsView') renderQuickWins();
  };

  // Mode and button navigation
  document.querySelectorAll('.wedge, .mode-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      renderModeView(mode);
    });
  });

  // Render mode view
  function renderModeView(mode) {
    const view = document.createElement('section');
    view.id = 'modeView';
    view.innerHTML = `
      <h2 class="mode-title">${mode} Mode</h2>
      <div id="modeActivities"></div>
      <button id="backToHome">Back to Home</button>
    `;
    document.getElementById('appContent').innerHTML = '';
    document.getElementById('appContent').appendChild(view);

    document.getElementById('backToHome').addEventListener('click', () => {
      window.location.reload(); // Reset to home
    });

    const activityList = getActivitiesForMode(mode);
    const container = document.getElementById('modeActivities');

    activityList.forEach((activity, index) => {
      const logKey = `${mode}-${index}`;
      const wrapper = document.createElement('div');
      wrapper.className = 'mode-activity';
      wrapper.innerHTML = `
        <p>${activity}</p>
        <input type="text" placeholder="What did you do?" value="${localStorage.getItem(logKey) || ''}" />
      `;
      const input = wrapper.querySelector('input');
      input.addEventListener('blur', () => {
        localStorage.setItem(logKey, input.value);
        logStreak();
      });
      container.appendChild(wrapper);
    });
  }

  function getActivitiesForMode(mode) {
    switch (mode) {
      case 'Surviving': return [
        "Drink a glass of water",
        "Take 3 deep breaths",
        "Step outside for 2 minutes"
      ];
      case 'Drifting': return [
        "Write down 1 thing you’re grateful for",
        "Tidy a small space",
        "Play your favorite song"
      ];
      case 'Grounded': return [
        "Go for a walk",
        "Cook a simple meal",
        "Text someone you care about"
      ];
      case 'Growing': return [
        "Journal for 5 minutes",
        "Try a new workout or activity",
        "Plan tomorrow’s top task"
      ];
      default: return [];
    }
  }

  function logStreak() {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('lastResetDate', today);
    updateStreakDisplay();
  }

  function updateStreakDisplay() {
    const today = new Date().toISOString().split('T')[0];
    const last = localStorage.getItem('lastResetDate');
    let streak = parseInt(localStorage.getItem('streak') || '0');

    if (last !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const ymd = yesterday.toISOString().split('T')[0];

      if (last === ymd) {
        streak += 1;
      } else {
        streak = 1;
      }

      localStorage.setItem('streak', streak.toString());
      localStorage.setItem('lastResetDate', today);
    }

    const streakDisplay = document.getElementById('streakDisplay');
    if (streakDisplay) {
      streakDisplay.textContent = `🔥 Daily Streak: ${streak} day${streak === 1 ? '' : 's'}`;
    }
  }

  function renderHistory() {
    const container = document.getElementById('historyView');
    container.innerHTML = `<h2>History</h2><div id="historyContent"></div>`;
    const log = [];

    Object.keys(localStorage).forEach(key => {
      if (key.includes('-')) {
        log.push(`${key}: ${localStorage.getItem(key)}`);
      }
    });

    const content = document.getElementById('historyContent');
    content.innerHTML = log.length > 0
      ? `<ul>${log.map(item => `<li>${item}</li>`).join('')}</ul>`
      : '<p>No logs yet. Try an activity!</p>';
  }

  function renderQuickWins() {
    const view = document.getElementById('quickWinsView');
    const content = document.createElement('div');
    content.id = 'quickWinsContent';
    content.innerHTML = `
      <div class="mode-activity">
        <p>Stand up and stretch</p>
        <input type="text" placeholder="What did you do?" />
      </div>
      <div class="mode-activity">
        <p>Drink water</p>
        <input type="text" placeholder="What did you do?" />
      </div>
      <div class="mode-activity">
        <p>Reset your posture</p>
        <input type="text" placeholder="What did you do?" />
      </div>
    `;
    view.appendChild(content);
  }

  // Show streak if available
  updateStreakDisplay();
});