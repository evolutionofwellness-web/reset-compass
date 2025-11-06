// The Reset Compass - Main Application Script
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
    1: [ // Surviving
      'Take 3 deep breaths',
      'Drink a glass of water',
      'Step outside for 2 minutes',
      'Set one tiny goal for today'
    ],
    2: [ // Drifting
      'Write down 3 things you\'re grateful for',
      'Take a 10-minute walk',
      'Call or text a friend',
      'Tidy one small space'
    ],
    3: [ // Grounded
      'Plan tomorrow evening',
      'Do a 15-minute workout',
      'Read for 20 minutes',
      'Practice a new skill for 30 minutes'
    ],
    4: [ // Growing
      'Set a challenging goal',
      'Learn something new for 1 hour',
      'Connect with a mentor',
      'Celebrate a recent win'
    ]
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

  // Detect motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize app
  async function init() {
    try {
      await loadModes();
      renderModes();
      setupEventListeners();
      setupScrollAnimation();
      playIntroAnimation();
      registerServiceWorker();
      setupInstallPrompt();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      modesGrid.innerHTML = '<p class="no-js-message">Failed to load modes. Please refresh the page.</p>';
    }
  }

  // Load modes from JSON
  async function loadModes() {
    const response = await fetch('/data/modes.json');
    if (!response.ok) {
      throw new Error('Failed to load modes data');
    }
    modes = await response.json();
  }

  // Render mode cards
  function renderModes() {
    modesGrid.innerHTML = modes.map(mode => `
      <button 
        class="mode-card" 
        data-mode-id="${mode.id}"
        role="listitem"
        aria-label="Select ${mode.name} mode"
        style="border-color: ${mode.color}20"
      >
        <span class="mode-icon" aria-hidden="true">${mode.icon}</span>
        <h3 class="mode-name">${mode.name}</h3>
        <span class="mode-badge" style="background: ${mode.color}33; color: ${mode.color}">
          ${mode.name}
        </span>
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

  // Open mode dialog
  function openModeDialog(modeId) {
    currentMode = modes.find(m => m.id === modeId);
    if (!currentMode) return;

    // Populate dialog
    document.getElementById('dialogModeIcon').textContent = currentMode.icon;
    document.getElementById('modeDialogTitle').textContent = currentMode.name;
    document.getElementById('dialogModeDescription').textContent = currentMode.description;
    document.getElementById('dialogModeQuote').textContent = `"${currentMode.defaultQuote}"`;

    // Populate quick wins
    const quickWins = quickWinsMap[currentMode.id] || [];
    document.getElementById('dialogQuickWins').innerHTML = quickWins
      .map(win => `<li>${win}</li>`)
      .join('');

    // Show dialog
    modeDialog.showModal();
    
    // Focus management
    const closeButton = modeDialog.querySelector('.dialog-close');
    if (closeButton) {
      closeButton.focus();
    }
  }

  // Start reset and record to history
  function startReset() {
    if (!currentMode) return;

    const quickWins = quickWinsMap[currentMode.id] || [];
    const selectedWin = quickWins[0] || 'No action selected';

    const historyEntry = {
      timestamp: new Date().toISOString(),
      modeId: currentMode.id,
      modeName: currentMode.name,
      modeIcon: currentMode.icon,
      modeColor: currentMode.color,
      action: selectedWin
    };

    // Save to localStorage
    const history = getHistory();
    history.push(historyEntry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    // Close dialog
    modeDialog.close();

    // Show confirmation (could be a toast notification)
    alert(`Reset started! ${currentMode.icon} ${currentMode.name}\nAction: ${selectedWin}`);
  }

  // Get history from localStorage
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

    // Calculate stats
    const modeStats = {};
    modes.forEach(mode => {
      modeStats[mode.id] = {
        count: 0,
        name: mode.name,
        icon: mode.icon,
        color: mode.color
      };
    });

    history.forEach(entry => {
      if (modeStats[entry.modeId]) {
        modeStats[entry.modeId].count++;
      }
    });

    const totalResets = history.length;

    // Render stats
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

    // Render timeline
    const timelineHtml = history.length > 0
      ? history.slice().reverse().map(entry => {
          const date = new Date(entry.timestamp);
          const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `
            <div class="history-entry" style="border-left-color: ${entry.modeColor}">
              <div class="history-entry-info">
                <div class="history-entry-mode">
                  <span aria-hidden="true">${entry.modeIcon}</span>
                  ${entry.modeName}
                </div>
                <div class="history-entry-time">${timeStr}</div>
                <div class="history-entry-action">${entry.action}</div>
              </div>
            </div>
          `;
        }).join('')
      : '<div class="empty-history">No reset history yet. Start your first reset!</div>';

    document.getElementById('historyTimeline').innerHTML = timelineHtml;

    historyDialog.showModal();
  }

  // Export history as JSON
  function exportHistory() {
    const history = getHistory();
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reset-compass-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Clear history
  function clearHistory() {
    if (confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      localStorage.removeItem(HISTORY_KEY);
      historyDialog.close();
      alert('History cleared successfully.');
    }
  }

  // Play intro animation
  function playIntroAnimation() {
    const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY);
    
    if (!hasSeenIntro && !prefersReducedMotion) {
      // Animation already handled by CSS
      // Mark as seen
      localStorage.setItem(INTRO_SEEN_KEY, 'true');
    }
  }

  // Replay intro animation
  function replayIntro() {
    if (prefersReducedMotion) {
      alert('Animation disabled due to motion preferences.');
      return;
    }

    // Reset animations
    compassImage.style.animation = 'none';
    const heroIntro = document.querySelector('.hero-intro');
    if (heroIntro) {
      heroIntro.style.animation = 'none';
    }

    // Trigger reflow
    void compassImage.offsetWidth;

    // Restart animations
    compassImage.style.animation = 'fadeInScale 1s ease forwards';
    if (heroIntro) {
      heroIntro.style.animation = 'fadeInUp 1s 0.3s ease forwards';
    }
  }

  // Setup scroll-linked arrow rotation
  function setupScrollAnimation() {
    if (prefersReducedMotion) {
      return;
    }

    let ticking = false;

    function updateArrowRotation() {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = maxScroll > 0 ? scrollY / maxScroll : 0;
      const rotation = scrollPercent * 360;

      compassArrow.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
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
    // Mode dialog
    const startResetBtn = document.getElementById('startResetBtn');
    if (startResetBtn) {
      startResetBtn.addEventListener('click', startReset);
    }

    // Dialog close buttons
    document.querySelectorAll('.dialog-close, .dialog-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dialog = e.target.closest('dialog');
        if (dialog) {
          dialog.close();
        }
      });
    });

    // History
    if (historyBtn) {
      historyBtn.addEventListener('click', openHistoryDialog);
    }

    const exportHistoryBtn = document.getElementById('exportHistoryBtn');
    if (exportHistoryBtn) {
      exportHistoryBtn.addEventListener('click', exportHistory);
    }

    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', clearHistory);
    }

    // Replay button
    if (replayBtn) {
      replayBtn.addEventListener('click', replayIntro);
    }

    // Keyboard handlers
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modeDialog.open) {
          modeDialog.close();
        }
        if (historyDialog.open) {
          historyDialog.close();
        }
      }
    });

    // Dialog backdrop click
    [modeDialog, historyDialog].forEach(dialog => {
      if (dialog) {
        dialog.addEventListener('click', (e) => {
          const rect = dialog.getBoundingClientRect();
          const isInDialog = (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          );
          if (!isInDialog) {
            dialog.close();
          }
        });
      }
    });
  }

  // Register service worker
  async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Setup install prompt
  let deferredPrompt;

  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Show install button
      if (installBtn) {
        installBtn.hidden = false;
      }
    });

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
          return;
        }

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
      if (installBtn) {
        installBtn.hidden = true;
      }
    });
  }

  // Start the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
