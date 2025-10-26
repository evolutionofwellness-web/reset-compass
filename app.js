// app.js v12 — Fully working, polished Reset Compass logic

document.addEventListener('DOMContentLoaded', () => {
  // Splash screen auto-hide
  const splash = document.getElementById('splashScreen');
  if (splash) {
    setTimeout(() => splash.style.display = 'none', 2000);
  }

  // Daily streak
  const streakDisplay = document.getElementById('streakDisplay');
  const today = new Date().toDateString();
  let streak = Number(localStorage.getItem('streak')) || 0;
  let lastLogged = localStorage.getItem('lastLogged');

  function updateStreakDisplay() {
    streakDisplay.textContent = `🔥 ${streak}-day streak`;
  }

  function logTodayIfNew() {
    if (lastLogged !== today) {
      streak += 1;
      localStorage.setItem('streak', streak);
      localStorage.setItem('lastLogged', today);
      updateStreakDisplay();
    }
  }

  updateStreakDisplay();

  // Mode navigation
  const pages = document.querySelectorAll('.page');
  const links = document.querySelectorAll('.nav-link');
  const compassLinks = document.querySelectorAll('.compass-wedge, .mode-btn');

  function showPage(id) {
    pages.forEach(p => p.classList.remove('active'));
    const page = document.getElementById(id);
    if (page) page.classList.add('active');
  }

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      if (target) showPage(target);
    });
  });

  compassLinks.forEach(el => {
    el.addEventListener('click', () => {
      const mode = el.getAttribute('data-mode');
      if (mode) showPage(`${mode}-page`);
    });
  });

  // Activity logging
  const logButtons = document.querySelectorAll('.log-btn');

  logButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      const textarea = document.querySelector(`#${mode}-text`);
      const log = textarea.value.trim();
      if (log !== '') {
        const timestamp = new Date().toLocaleString();
        const entry = { mode, log, timestamp };
        let history = JSON.parse(localStorage.getItem('history')) || [];
        history.unshift(entry);
        localStorage.setItem('history', JSON.stringify(history));
        textarea.value = '';
        logTodayIfNew();
        alert('Activity logged!');
      }
    });
  });

  // Load history
  const historyContainer = document.getElementById('historyList');
  function renderHistory() {
    const data = JSON.parse(localStorage.getItem('history')) || [];
    historyContainer.innerHTML = '';
    if (data.length === 0) {
      historyContainer.innerHTML = '<p>No activity logged yet.</p>';
    } else {
      data.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'history-entry';
        div.innerHTML = `
          <strong>${entry.mode.toUpperCase()}</strong>: ${entry.log}
          <br><small>${entry.timestamp}</small>
        `;
        historyContainer.appendChild(div);
      });
    }
  }

  renderHistory();
});