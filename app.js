// app.js v11 — Reset Compass Logic
document.addEventListener('DOMContentLoaded', () => {
  // Splash screen animation
  const splashScreen = document.getElementById('splashScreen');
  const splashIcon = document.getElementById('splashIcon');
  if (splashScreen && splashIcon) {
    splashIcon.classList.add('splash-animate');
    setTimeout(() => {
      splashScreen.style.display = 'none';
    }, 1600);
  }

  // One-time welcome popup
  const welcomePopup = document.getElementById('welcomePopup');
  const letsStartBtn = document.getElementById('letsStartBtn');
  if (localStorage.getItem('welcomeShown') !== 'true') {
    welcomePopup.style.display = 'flex';
  }
  if (letsStartBtn) {
    letsStartBtn.addEventListener('click', () => {
      welcomePopup.style.display = 'none';
      localStorage.setItem('welcomeShown', 'true');
    });
  }

  // Daily streak and logging
  const today = new Date().toISOString().slice(0, 10);
  const lastEntry = localStorage.getItem('lastLoggedDate');
  const streakKey = 'modeStreak';
  let streak = parseInt(localStorage.getItem(streakKey)) || 0;
  if (lastEntry !== today && lastEntry !== null) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (lastEntry === yesterday) {
      streak += 1;
    } else {
      streak = 0;
    }
    localStorage.setItem(streakKey, streak);
  }
  localStorage.setItem('lastLoggedDate', today);
  document.querySelector('.stats')?.insertAdjacentHTML('beforeend',
    `<div><span style="font-size:1.4rem;">🔥</span> ${streak}</div>`);

  // Navigation
  const sections = ['home', 'wins', 'history', 'about'];
  sections.forEach(id => {
    document.getElementById(`nav-${id}`)?.addEventListener('click', () => {
      sections.forEach(sec => {
        document.getElementById(sec).style.display = sec === id ? 'block' : 'none';
      });
    });
  });

  // Mode selection
  const modeDescriptions = {
    Surviving: 'running on empty',
    Drifting: 'okay but unfocused',
    Grounded: 'steady and consistent',
    Growing: 'ready to push a little'
  };

  function saveModeChoice(mode) {
    const modeLog = JSON.parse(localStorage.getItem('modeLog') || '[]');
    modeLog.push({ date: today, mode });
    localStorage.setItem('modeLog', JSON.stringify(modeLog));
    localStorage.setItem('lastLoggedDate', today);
    showToast(`Logged mode: ${mode}`);
    renderHistory();
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 2500);
  }

  // Mode buttons and compass
  ['Surviving', 'Drifting', 'Grounded', 'Growing'].forEach(mode => {
    const btn = document.getElementById(`btn-${mode}`);
    if (btn) {
      btn.addEventListener('click', () => saveModeChoice(mode));
    }
  });

  document.querySelectorAll('.mode-wedge').forEach(el => {
    el.addEventListener('click', () => {
      const mode = el.getAttribute('data-mode');
      if (mode) saveModeChoice(mode);
    });
  });

  // History
  function renderHistory() {
    const historyEl = document.getElementById('mode-history');
    if (!historyEl) return;
    const data = JSON.parse(localStorage.getItem('modeLog') || '[]').slice().reverse();
    historyEl.innerHTML = data.length
      ? data.map(entry => `<div class="history-entry"><strong>${entry.date}</strong>: ${entry.mode}</div>`).join('')
      : '<p>No mode entries yet.</p>';
  }

  renderHistory();
});
