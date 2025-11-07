// The Reset Compass - Main Application Script (final, clean)
(function() {
  'use strict';

  // State
  let modes = [];
  let currentMode = null;
  let animationFrameId = null;
  const HISTORY_KEY = 'resetCompassHistory';
  const INTRO_SEEN_KEY = 'resetCompassIntroSeen';

  // Quick wins placeholder data per mode
  const quickWinsMap = {
    1: [ 'Take 3 deep breaths', 'Drink a glass of water', 'Step outside for 2 minutes', 'Set one tiny goal for today' ],
    2: [ "Write down 3 things you're grateful for", 'Take a 10-minute walk', 'Call or text a friend', 'Tidy one small space' ],
    3: [ 'Plan tomorrow evening', 'Do a 15-minute workout', 'Read for 20 minutes', 'Practice a new skill for 30 minutes' ],
    4: [ 'Set a challenging goal', 'Learn something new for 1 hour', 'Connect with a mentor', 'Celebrate a recent win' ]
  };

  // Elements
  const modesGrid = document.getElementById('modesGrid');
  const modeDialog = document.getElementById('modeDialog');
  const historyDialog = document.getElementById('historyDialog');
  const compassArrow = document.getElementById('compassArrow');
  const compassImage = document.getElementById('compassImage');
  const replayBtn = document.getElementById('replayBtn');
  const historyBtn = document.getElementById('historyBtn');
  const installBtn = document.getElementById('installBtn');
  const compassRing = document.getElementById('compassRing');

  // Detect motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize app
  async function init() {
    try {
      await loadModes();
      renderModes();
      renderCompassRing(); // show modes as directions on compass
      setupEventListeners();
      setupScrollAnimation();
      playIntroAnimation();
      registerServiceWorker();
      setupInstallPrompt();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      if (modesGrid) modesGrid.innerHTML = '<p class="no-js-message">Failed to load modes. Please refresh the page.</p>';
    }
  }

  // Load modes from JSON (relative path)
  async function loadModes() {
    const response = await fetch('data/modes.json');
    if (!response.ok) {
      throw new Error('Failed to load modes data');
    }
    modes = await response.json();
  }

  // Render mode cards (list under the compass)
  function renderModes() {
    if (!modesGrid) return;
    if (!Array.isArray(modes) || modes.length === 0) {
      modesGrid.innerHTML = '<p class="no-js-message">No modes available.</p>';
      return;
    }

    modesGrid.innerHTML = modes.map(mode => `
      <button
        class="mode-card"
        data-mode-id="${mode.id}"
        role="listitem"
        aria-label="Select ${mode.name} mode"
        style="border-color: ${mode.color}22"
      >
        <span class="mode-icon" aria-hidden="true">${mode.icon}</span>
        <div class="mode-meta">
          <h3 class="mode-name">${mode.name}</h3>
          <div class="mode-desc">${mode.description}</div>
        </div>
      </button>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        const modeId = parseInt(card.dataset.modeId);
        openModeDialog(modeId);
      });
    });
  }

  // Render compass ring (four buttons around the compass)
  function renderCompassRing() {
    if (!compassRing || !Array.isArray(modes)) return;
    compassRing.innerHTML = '';

    // Map modes to compass positions (adjust these mappings if you later change mode order)
    const posMap = [
      { pos: 'top', id: 4 },    // Growing
      { pos: 'right', id: 2 },  // Drifting
      { pos: 'bottom', id: 1 }, // Surviving
      { pos: 'left', id: 3 }    // Grounded
    ];

    posMap.forEach(({ pos, id }) => {
      const mode = modes.find(m => m.id === id);
      if (!mode) return;
      const btn = document.createElement('button');
      btn.className = `ring-btn ring-${pos}`;
      btn.setAttribute('aria-label', `${mode.name} mode`);
      btn.dataset.modeId = mode.id;
      btn.innerHTML = `<span class="ring-icon" aria-hidden="true">${mode.icon}</span><span class="ring-label">${mode.name}</span>`;
      btn.style.setProperty('--mode-color', mode.color);
      btn.addEventListener('click', () => openModeDialog(mode.id));
      compassRing.appendChild(btn);
    });
  }

  // Open mode dialog
  function openModeDialog(modeId) {
    currentMode = modes.find(m => m.id === modeId);
    if (!currentMode) return;

    // Populate dialog
    const iconEl = document.getElementById('dialogModeIcon');
    const titleEl = document.getElementById('modeDialogTitle');
    const descEl = document.getElementById('dialogModeDescription');
    const quoteEl = document.getElementById('dialogModeQuote');
    const quickWinsEl = document.getElementById('dialogQuickWins');

    if (iconEl) iconEl.textContent = currentMode.icon;
    if (titleEl) titleEl.textContent = currentMode.name;
    if (descEl) descEl.textContent = currentMode.description;
    if (quoteEl) quoteEl.textContent = `"${currentMode.defaultQuote}"`;

    const quickWins = quickWinsMap[currentMode.id] || [];
    if (quickWinsEl) {
      quickWinsEl.innerHTML = quickWins
        .map(win => `<li><button class="quick-win-btn" data-win="${escapeHtml(win)}">${escapeHtml(win)}</button></li>`)
        .join('');
      // Attach handlers
      quickWinsEl.querySelectorAll('.quick-win-btn').forEach(b => {
        b.addEventListener('click', (e) => {
          const winText = e.currentTarget.dataset.win;
          startReset(winText);
        });
      });
    }

    if (typeof modeDialog.showModal === 'function') {
      modeDialog.showModal();
      const closeButton = modeDialog.querySelector('.dialog-close');
      if (closeButton) closeButton.focus();
    } else {
      alert(`${currentMode.name}\n\n${currentMode.description}`);
    }
  }

  // Start reset and record to history
  function startReset(selectedAction) {
    if (!currentMode) return;

    const selectedWin = selectedAction || (quickWinsMap[currentMode.id] && quickWinsMap[currentMode.id][0]) || 'No action selected';

    const historyEntry = {
      timestamp: new Date().toISOString(),
      modeId: currentMode.id,
      modeName: currentMode.name,
      modeIcon: currentMode.icon,
      modeColor: currentMode.color,
      action: selectedWin
    };

    const history = getHistory();
    history.push(historyEntry);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save history', e);
    }

    try { if (modeDialog.close) modeDialog.close(); } catch (e) {}
    showToast(`Saved: ${currentMode.name} — ${selectedWin}`);
  }

  // Get history
  function getHistory() {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }

  // Open history dialog
  function openHistoryDialog() {
    const history = getHistory();

    const modeStats = {};
    modes.forEach(mode => {
      modeStats[mode.id] = { count: 0, name: mode.name, icon: mode.icon, color: mode.color };
    });

    history.forEach(entry => {
      if (modeStats[entry.modeId]) modeStats[entry.modeId].count++;
    });

    const totalResets = history.length;

    const statsHtml = `
      <div class="stat-card">
        <span class="stat-value">${totalResets}</span>
        <span class="stat-label">Total Resets</span>
      </div>
      ${modes.map(mode => {
        const stats = modeStats[mode.id];
        const percent = totalResets > 0 ? Math.round((stats.count / totalResets) * 100) : 0;
        return `
          <div class="stat-card">
            <span class="stat-value" style="color: ${mode.color}">${percent}%</span>
            <span class="stat-label">${mode.icon} ${mode.name}</span>
          </div>
        `;
      }).join('')}
    `;
    document.getElementById('historyStats').innerHTML = statsHtml;

    const timelineHtml = history.length > 0
      ? history.slice().reverse().map(entry => {
          const date = new Date(entry.timestamp);
          const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `
            <div class="history-entry" style="border-left-color: ${entry.modeColor}">
              <div class="history-entry-info">
                <div class="history-entry-mode">
                  <span aria-hidden="true">${entry.modeIcon}</span>
                  ${escapeHtml(entry.modeName)}
                </div>
                <div class="history-entry-time">${timeStr}</div>
                <div class="history-entry-action">${escapeHtml(entry.action)}</div>
              </div>
            </div>
          `;
        }).join('')
      : '<div class="empty-history">No reset history yet. Start your first reset!</div>';

    document.getElementById('historyTimeline').innerHTML = timelineHtml;

    if (typeof historyDialog.showModal === 'function') historyDialog.showModal();
  }

  // Export history
  function exportHistory() {
    const history = getHistory();
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reset-compass-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  // Clear history
  function clearHistory() {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      localStorage.removeItem(HISTORY_KEY);
      try { historyDialog.close(); } catch (e) {}
      showToast('History cleared');
    }
  }

  // Play intro animation
  function playIntroAnimation() {
    const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY);
    if (!hasSeenIntro && !prefersReducedMotion) {
      localStorage.setItem(INTRO_SEEN_KEY, 'true');
    }
  }

  // Replay intro
  function replayIntro() {
    if (prefersReducedMotion) {
      showToast('Animations disabled (reduced motion).');
      return;
    }
    compassImage.style.animation = 'none';
    const heroIntro = document.querySelector('.hero-intro');
    if (heroIntro) heroIntro.style.animation = 'none';
    void compassImage.offsetWidth;
    compassImage.style.animation = 'fadeInScale 1s ease forwards';
    if (heroIntro) heroIntro.style.animation = 'fadeInUp 1s 0.3s ease forwards';
  }

  // Scroll-linked arrow rotation
  function setupScrollAnimation() {
    if (prefersReducedMotion) return;

    let ticking = false;

    function updateArrowRotation() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = maxScroll > 0 ? scrollY / maxScroll : 0;
      const rotation = scrollPercent * 360;
      if (compassArrow) compassArrow.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
      ticking = false;
    }

    function requestTick() {
      if (!ticking) {
        animationFrameId = requestAnimationFrame(updateArrowRotation);
        ticking = true;
      }
    }

    window.addEventListener('scroll', requestTick, { passive: true });
  }

  // Setup event listeners
  function setupEventListeners() {
    const startResetBtn = document.getElementById('startResetBtn');
    if (startResetBtn) startResetBtn.addEventListener('click', () => startReset());

    document.querySelectorAll('.dialog-close, .dialog-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dialog = e.target.closest('dialog');
        if (dialog) dialog.close();
      });
    });

    if (historyBtn) historyBtn.addEventListener('click', openHistoryDialog);

    const exportHistoryBtn = document.getElementById('exportHistoryBtn');
    if (exportHistoryBtn) exportHistoryBtn.addEventListener('click', exportHistory);

    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);

    if (replayBtn) replayBtn.addEventListener('click', replayIntro);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        try { if (modeDialog.open) modeDialog.close(); } catch (e) {}
        try { if (historyDialog.open) historyDialog.close(); } catch (e) {}
      }
    });
  }

  // Register service worker
  async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Install prompt
  let deferredPrompt;
  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (installBtn) installBtn.hidden = false;
    });

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        deferredPrompt = null;
        installBtn.hidden = true;
      });
    }

    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      deferredPrompt = null;
      if (installBtn) installBtn.hidden = true;
    });
  }

  // Small toast helper
  function showToast(text, ms = 1800) {
    const el = document.createElement('div');
    el.className = 'rc-toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('visible'), 20);
    setTimeout(() => { el.classList.remove('visible'); setTimeout(()=>el.remove(), 300); }, ms);
  }

  // escape helper
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); }); }

  // Start the app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
