// Updated script.js — wedges, spaced compass directions, event delegation, buffered history writes, gentle performance improvements
(function() {
  'use strict';

  let modes = [];
  let currentMode = null;

  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const INTRO_SEEN_KEY = 'resetCompassIntroSeen';

  // Subtle decorative spin: 720 degrees across the page (two rotations)
  const ROTATION_MULTIPLIER = 720;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // In-memory history cache to avoid repeated synchronous reads/writes on every interaction
  let historyCache = null;
  let historyFlushTimer = null;
  const HISTORY_FLUSH_DELAY = 700; // ms - debounce writes to localStorage

  // Quick wins (kept simple)
  const quickWinsMap = {
    1: [ 'Take 3 deep breaths', 'Drink a glass of water', 'Step outside for 2 minutes', 'Set one tiny goal for today' ],
    2: [ "Write down 3 things you're grateful for", 'Take a 10-minute walk', 'Call or text a friend', 'Tidy one small space' ],
    3: [ 'Plan tomorrow evening', 'Do a 15-minute workout', 'Read for 20 minutes', 'Practice a new skill for 30 minutes' ],
    4: [ 'Set a challenging goal', 'Learn something new for 1 hour', 'Connect with a mentor', 'Celebrate a recent win' ]
  };

  // DOM refs
  const modesGrid = document.getElementById('modesGrid');
  const modeDialog = document.getElementById('modeDialog');
  const historyDialog = document.getElementById('historyDialog');
  const compassRing = document.getElementById('compassRing');
  const compassWedges = document.getElementById('compassWedges');
  const compassArrow = document.getElementById('compassArrow');
  const compassImage = document.getElementById('compassImage');
  const historyBtn = document.getElementById('historyBtn');
  const replayBtn = document.getElementById('replayBtn');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  // --- Initialization ---
  async function init() {
    try {
      applySavedTheme();
      await loadModes();
      initHistoryCache();
      renderModes();
      renderCompassRing();
      setupEventListeners();
      if (!prefersReducedMotion) setupScrollAnimation();
      markIntroSeen();
    } catch (err) {
      console.error('Init failed', err);
      if (modesGrid) modesGrid.innerHTML = '<p class="no-js-message">Failed to load modes. Please refresh.</p>';
    }
  }

  async function loadModes() {
    const res = await fetch('data/modes.json');
    if (!res.ok) throw new Error('Modes load failed');
    modes = await res.json();
  }

  function initHistoryCache() {
    try {
      historyCache = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch (e) {
      historyCache = [];
    }
  }

  // --- Helpers ---
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }

  // Return black or white depending on perceived luminance of hex color
  function getContrastColor(hex) {
    if (!hex) return '#fff';
    const h = hex.replace('#','').trim();
    const r = parseInt(h.length === 3 ? h[0]+h[0] : h.slice(0,2), 16);
    const g = parseInt(h.length === 3 ? h[1]+h[1] : h.slice(h.length===3?1:2, h.length===3?2:4), 16);
    const b = parseInt(h.length === 3 ? h[2]+h[2] : h.slice(h.length===3?2:4, h.length), 16);
    const luminance = (0.299*r + 0.587*g + 0.114*b);
    return luminance > 186 ? '#000' : '#fff';
  }

  // buffered write to localStorage to avoid blocking the main thread on every interaction
  function bufferedSaveHistory(latest) {
    historyCache = latest;
    if (historyFlushTimer) clearTimeout(historyFlushTimer);
    historyFlushTimer = setTimeout(() => {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(historyCache || []));
      } catch (e) {
        console.warn('Failed to save history', e);
      }
      historyFlushTimer = null;
    }, HISTORY_FLUSH_DELAY);
  }

  function getHistory() {
    if (historyCache === null) initHistoryCache();
    return historyCache || [];
  }

  // --- Rendering: modes grid ---
  function renderModes() {
    if (!modesGrid) return;
    if (!Array.isArray(modes) || modes.length === 0) {
      modesGrid.innerHTML = '<p class="no-js-message">No modes available.</p>';
      return;
    }

    modesGrid.innerHTML = modes.map(mode => {
      const safeName = escapeHtml(mode.name || 'Mode');
      const safeDesc = escapeHtml(mode.description || '');
      const color = mode.color || '#00AFA0';
      return `
        <button class="mode-card" data-mode-id="${mode.id}" aria-label="Select ${safeName} mode" style="--mode-color: ${color}">
          <div class="mode-meta">
            <div class="mode-name">${safeName}</div>
            <div class="mode-desc">${safeDesc}</div>
          </div>
        </button>
      `;
    }).join('');
  }

  // --- Rendering: compass ring + wedges ---
  function renderCompassRing() {
    if (!compassRing) return;
    compassRing.innerHTML = '';

    // choose up to 4 modes in a stable order (prefer 4,2,1,3 if present)
    const preferOrder = [4,2,1,3];
    const hasPrefer = preferOrder.every(id => modes.find(m => m.id === id));
    const chosen = [];
    if (hasPrefer) {
      preferOrder.forEach(id => chosen.push(modes.find(m => m.id === id)));
    } else {
      for (let i = 0; i < Math.min(4, modes.length); i++) chosen.push(modes[i]);
    }

    // build the wedge background to match chosen order
    buildWedges(chosen);

    const positions = ['top','right','bottom','left'];
    chosen.forEach((mode, idx) => {
      if (!mode) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ring-btn ring-${positions[idx]}`;
      btn.setAttribute('aria-label', `${mode.name} mode`);
      btn.dataset.modeId = mode.id;
      btn.innerHTML = `<span class="ring-label">${escapeHtml(mode.name)}</span>`;

      const base = mode.color || '#00AFA0';
      // translucent overlay; if hex is 6-digit append alpha
      const bg = /^#([A-Fa-f0-9]{6})$/.test(base) ? `${base}22` : `${base}22`;
      btn.style.background = `linear-gradient(180deg, ${bg}, rgba(0,0,0,0.06))`;
      btn.style.setProperty('--mode-color', base);
      btn.style.color = getContrastColor(base);

      // pointer-events and click handled by delegated handler
      compassRing.appendChild(btn);
    });
  }

  // Build a conic-gradient wedge background behind the ring
  function buildWedges(chosenModes) {
    if (!compassWedges) return;
    const N = chosenModes.length || 0;
    if (N === 0) {
      compassWedges.style.background = 'transparent';
      return;
    }
    const portion = 360 / N;
    const entries = chosenModes.map((m, i) => {
      const color = (m && m.color) ? m.color : '#00AFA0';
      const stopColor = /^#([A-Fa-f0-9]{6})$/.test(color) ? color + '22' : color;
      const start = Math.round(i * portion);
      const end = Math.round((i + 1) * portion);
      return `${stopColor} ${start}deg ${end}deg`;
    });
    compassWedges.style.background = `conic-gradient(${entries.join(',')})`;
  }

  // --- Mode dialog / quick wins ---
  function openModeDialog(modeId) {
    const m = modes.find(x => x.id === Number(modeId));
    if (!m) return;
    currentMode = m;

    const titleEl = document.getElementById('modeDialogTitle');
    const descEl = document.getElementById('dialogModeDescription');
    const quoteEl = document.getElementById('dialogModeQuote');
    const quickWinsEl = document.getElementById('dialogQuickWins');

    if (titleEl) titleEl.textContent = m.name;
    if (descEl) descEl.textContent = m.description || '';
    if (quoteEl) quoteEl.textContent = m.defaultQuote ? `"${m.defaultQuote}"` : '';

    const quickWins = quickWinsMap[m.id] || [];
    if (quickWinsEl) {
      quickWinsEl.innerHTML = quickWins.map(w => `<li><button class="quick-win-btn" data-win="${escapeHtml(w)}">${escapeHtml(w)}</button></li>`).join('');
      // attach listeners to each quick-win button (few, so fine)
      quickWinsEl.querySelectorAll('.quick-win-btn').forEach(b => {
        b.addEventListener('click', (e) => {
          e.preventDefault();
          // read dataset and call startReset quickly
          const act = e.currentTarget.dataset.win;
          startReset(act);
        }, { once: true });
      });
    }

    if (typeof modeDialog.showModal === 'function') {
      modeDialog.showModal();
      const close = modeDialog.querySelector('.dialog-close');
      if (close) close.focus();
    } else {
      alert(`${m.name}\n\n${m.description || ''}`);
    }
  }

  // Record activity to history (fast) and schedule persisted write (debounced)
  function startReset(selectedAction) {
    if (!currentMode) return;
    const action = selectedAction || (quickWinsMap[currentMode.id] && quickWinsMap[currentMode.id][0]) || 'No action selected';

    // fast in-memory update
    const entry = {
      timestamp: new Date().toISOString(),
      modeId: currentMode.id,
      modeName: currentMode.name,
      modeColor: currentMode.color,
      action
    };
    const h = getHistory();
    h.push(entry);

    // schedule a debounced write to localStorage to avoid blocking the UI
    bufferedSaveHistory(h);

    // close dialog quickly and show toast
    try { if (modeDialog.close) modeDialog.close(); } catch (e) {}
    showToast(`Activity started — ${currentMode.name}`);
  }

  // --- History UI ---
  function openHistoryDialog() {
    const history = getHistory();
    const statsEl = document.getElementById('historyStats');
    const timelineEl = document.getElementById('historyTimeline');

    const modeStats = {};
    modes.forEach(m => modeStats[m.id] = { count: 0, name: m.name, color: m.color });
    history.forEach(h => { if (modeStats[h.modeId]) modeStats[h.modeId].count++; });

    const total = history.length;
    if (statsEl) {
      statsEl.innerHTML = `<div class="stat-card"><span class="stat-value">${total}</span><span class="stat-label">Total Resets</span></div>` +
      modes.map(m => {
        const pct = total ? Math.round((modeStats[m.id].count / total) * 100) : 0;
        return `<div class="stat-card"><span class="stat-value" style="color:${m.color}">${pct}%</span><span class="stat-label">${escapeHtml(m.name)}</span></div>`;
      }).join('');
    }

    if (timelineEl) {
      timelineEl.innerHTML = history.length ? history.slice().reverse().map(entry => {
        const d = new Date(entry.timestamp);
        return `<div class="history-entry" style="border-left-color:${entry.modeColor}"><div class="history-entry-info"><div class="history-entry-mode">${escapeHtml(entry.modeName)}</div><div class="history-entry-time">${d.toLocaleString()}</div><div class="history-entry-action">${escapeHtml(entry.action)}</div></div></div>`;
      }).join('') : '<div class="empty-history">No reset history yet. Start your first reset!</div>';
    }

    if (typeof historyDialog.showModal === 'function') historyDialog.showModal();
  }

  function exportHistory() {
    const data = JSON.stringify(getHistory(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reset-compass-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function clearHistory() {
    if (!confirm('Clear all reset history? This cannot be undone.')) return;
    historyCache = [];
    try { localStorage.removeItem(HISTORY_KEY); } catch (e) { /* ignore */ }
    try { if (historyDialog.close) historyDialog.close(); } catch (e) {}
    showToast('History cleared');
  }

  // small toast
  function showToast(text, ms = 1400) {
    const el = document.createElement('div');
    el.className = 'rc-toast';
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 240); }, ms);
  }

  // Theme persistence
  function applySavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = saved || (prefersLight ? 'light' : 'dark');
    setTheme(theme);
  }
  function setTheme(name) {
    if (name === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
    try { localStorage.setItem(THEME_KEY, name); } catch (e) {}
    if (themeToggle) themeToggle.setAttribute('aria-pressed', name === 'light');
    if (themeIcon) themeIcon.textContent = name === 'light' ? '☀️' : '🌙';
  }
  function toggleTheme() {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'dark' : 'light');
  }

  // --- Events: delegation and lightweight handlers (helps INP) ---
  function setupEventListeners() {
    // single delegated click listener for mode-card and ring-btn
    document.addEventListener('click', function(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      // mode card
      const card = e.target.closest('.mode-card');
      if (card && card.dataset && card.dataset.modeId) {
        const id = Number(card.dataset.modeId);
        openModeDialog(id);
        return;
      }

      // ring button
      const ringBtn = e.target.closest('.ring-btn');
      if (ringBtn && ringBtn.dataset && ringBtn.dataset.modeId) {
        const id = Number(ringBtn.dataset.modeId);
        openModeDialog(id);
        return;
      }
    }, true /* capture to get early */);

    // keyboard activation for cards and ring buttons
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        const activeCard = document.activeElement;
        if (activeCard && (activeCard.classList.contains('mode-card') || activeCard.classList.contains('ring-btn'))) {
          e.preventDefault();
          const id = Number(activeCard.dataset.modeId);
          if (id) openModeDialog(id);
        }
      } else if (e.key === 'Escape') {
        try { if (modeDialog.open) modeDialog.close(); } catch (ee) {}
        try { if (historyDialog.open) historyDialog.close(); } catch (ee) {}
      }
    });

    // dialog close buttons and cancel buttons
    document.querySelectorAll('.dialog-close, .dialog-cancel').forEach(b => {
      b.addEventListener('click', (e) => {
        const d = e.target.closest('dialog');
        if (d && d.close) d.close();
      });
    });

    if (historyBtn) historyBtn.addEventListener('click', openHistoryDialog);
    const exportBtn = document.getElementById('exportHistoryBtn'); if (exportBtn) exportBtn.addEventListener('click', exportHistory);
    const clearBtn = document.getElementById('clearHistoryBtn'); if (clearBtn) clearBtn.addEventListener('click', clearHistory);

    if (replayBtn) replayBtn.addEventListener('click', () => {
      if (prefersReducedMotion) showToast('Animations disabled (reduced motion).');
      else {
        if (compassImage) {
          compassImage.style.transform = 'scale(0.98)';
          setTimeout(() => compassImage.style.transform = '', 220);
        }
      }
    });

    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // passive scroll listener + rAF update for arrow rotation (keeps main thread responsive)
    if (!prefersReducedMotion) {
      let ticking = false;
      window.addEventListener('scroll', function() {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const pct = max > 0 ? scrollY / max : 0;
            const rot = pct * ROTATION_MULTIPLIER;
            if (compassArrow) compassArrow.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  // --- Scroll animation fallback (kept small) ---
  function setupScrollAnimation() {
    // already handled in setupEventListeners via passive listener + rAF
  }

  function markIntroSeen() { try { if (!localStorage.getItem(INTRO_SEEN_KEY)) localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch (e) {} }

  // Start
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
