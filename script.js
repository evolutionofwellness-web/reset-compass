// Robust updated script.js — guarded DOM access, unified theme toggle IDs, single beginActivity flow,
// clear selection on close, dialog showModal fallback, global quick-wins, streak handling, debounced history writes.
(function() {
  'use strict';

  // --- State ---
  let modes = [];
  let currentMode = null;
  let selectedActivity = null;

  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const INTRO_SEEN_KEY = 'resetCompassIntroSeen';
  const STREAK_KEY = 'resetCompassStreak';
  const LAST_DAY_KEY = 'resetCompassLastDay';

  const ROTATION_MULTIPLIER = 720;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let historyCache = null;
  let historyFlushTimer = null;
  const HISTORY_FLUSH_DELAY = 700;

  const quickWinsMap = {
    1: [ 'Take 3 deep breaths', 'Drink a glass of water', 'Step outside for 2 minutes', 'Set one tiny goal for today' ],
    2: [ "Write down 3 things you're grateful for", 'Take a 10-minute walk', 'Call or text a friend', 'Tidy one small space' ],
    3: [ 'Plan tomorrow evening', 'Do a 15-minute workout', 'Read for 20 minutes', 'Practice a new skill for 30 minutes' ],
    4: [ 'Set a challenging goal', 'Learn something new for 1 hour', 'Connect with a mentor', 'Celebrate a recent win' ]
  };

  // --- DOM refs (may be null on non-compass pages) ---
  const modesGrid = document.getElementById('modesGrid');
  const compassRing = document.getElementById('compassRing');
  const compassWedges = document.getElementById('compassWedges');
  const compassArrow = document.getElementById('compassArrow');
  const compassImage = document.getElementById('compassImage');

  const modeDialog = document.getElementById('modeDialog');
  const quickWinsDialog = document.getElementById('quickWinsDialog');
  const historyDialog = document.getElementById('historyDialog');

  const dialogQuickWins = document.getElementById('dialogQuickWins');
  const startResetBtn = document.getElementById('startResetBtn');

  const globalQuickWinsList = document.getElementById('globalQuickWins');
  const startQuickWinBtn = document.getElementById('startQuickWinBtn');

  const historyBtn = document.getElementById('historyBtn');
  const quickWinsBtn = document.getElementById('quickWinsBtn');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  const streakBadges = document.querySelectorAll('#streakBadge');

  // --- Initialization ---
  async function init() {
    applySavedTheme();
    await loadModes();
    initHistoryCache();
    updateStreakDisplay();
    renderModes();
    renderCompassRing();
    renderGlobalQuickWins();
    setupEventListeners();
    if (!prefersReducedMotion) setupScrollAnimation();
    markIntroSeen();
  }

  async function loadModes() {
    try {
      const res = await fetch('data/modes.json');
      if (!res.ok) throw new Error('Modes load failed');
      modes = await res.json();
    } catch (e) {
      console.warn('Failed loading data/modes.json — using fallback modes', e);
      modes = [
        { id: 1, name: 'Grounding', description: 'Reset and reconnect', color:'#3BC4A3' },
        { id: 2, name: 'Growing', description: 'Small wins to progress', color:'#7BC96F' },
        { id: 3, name: 'Surviving', description: 'Energy & focus resets', color:'#F6C85F' },
        { id: 4, name: 'Exploring', description: 'Try something new', color:'#8A7AF3' }
      ];
    }
  }

  // --- History / Streak management ---
  function initHistoryCache() {
    try {
      historyCache = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch (e) {
      historyCache = [];
    }
  }

  function bufferedSaveHistory(latest) {
    historyCache = latest;
    if (historyFlushTimer) clearTimeout(historyFlushTimer);
    historyFlushTimer = setTimeout(() => {
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(historyCache || [])); } catch (e) { console.warn('Failed to save history', e); }
      historyFlushTimer = null;
    }, HISTORY_FLUSH_DELAY);
  }

  function getHistory() {
    if (historyCache === null) initHistoryCache();
    return historyCache || [];
  }

  function todayKey() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  function incrementStreakIfNeeded() {
    try {
      const lastDay = localStorage.getItem(LAST_DAY_KEY);
      const today = todayKey();
      let streak = Number(localStorage.getItem(STREAK_KEY) || 0);

      if (lastDay === today) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().split('T')[0];

      if (lastDay === yKey) streak = streak + 1;
      else streak = 1;

      localStorage.setItem(STREAK_KEY, String(streak));
      localStorage.setItem(LAST_DAY_KEY, today);
      updateStreakDisplay();
    } catch (e) {
      console.warn('streak update failed', e);
    }
  }

  function updateStreakDisplay() {
    const streak = Number(localStorage.getItem(STREAK_KEY) || 0);
    streakBadges.forEach(b => {
      if (b) b.textContent = `🔥 ${streak}`;
    });
  }

  // --- Helpers ---
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function(m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }

  function getContrastColor(hex) {
    if (!hex) return '#fff';
    const h = hex.replace('#','').trim();
    const r = parseInt(h.length===3? h[0]+h[0] : h.slice(0,2),16);
    const g = parseInt(h.length===3? h[1]+h[1] : h.slice(h.length===3?1:2, h.length===3?2:4),16);
    const b = parseInt(h.length===3? h[2]+h[2] : h.slice(h.length===3?2:4, h.length),16);
    const luminance = (0.299*r + 0.587*g + 0.114*b);
    return luminance > 186 ? '#000' : '#fff';
  }

  // show a dialog with a simple fallback if showModal isn't supported
  function safeShowDialog(d) {
    if (!d) return;
    if (typeof d.showModal === 'function') {
      try {
        d.showModal();
        // focus first focusable element inside dialog
        const f = d.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (f) f.focus();
      } catch (e) {
        // fallback to alert if showModal throws
        d.style.display = 'none';
        alert(d.textContent || 'Dialog opened');
      }
    } else {
      // very simple fallback: use alert with dialog heading + content
      const title = d.querySelector('h2') ? d.querySelector('h2').textContent : '';
      const txt = Array.from(d.querySelectorAll('p, li')).map(n => n.textContent.trim()).filter(Boolean).join('\n');
      alert((title ? title + '\n\n' : '') + txt);
    }
  }

  function safeCloseDialog(d) {
    if (!d) return;
    try {
      if (typeof d.close === 'function' && d.open) d.close();
    } catch (e) {
      // ignore
    }
  }

  // --- Render modes grid ---
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
        <button class="mode-card" data-mode-id="${mode.id}" aria-label="Select ${safeName} mode" style="--mode-color:${color}">
          <div class="mode-meta">
            <div class="mode-name">${safeName}</div>
            <div class="mode-desc">${safeDesc}</div>
          </div>
        </button>
      `;
    }).join('');
  }

  // --- Compass ring + wedges ---
  function renderCompassRing() {
    if (!compassRing) return;
    compassRing.innerHTML = '';

    const preferOrder = [4,2,1,3];
    const hasPrefer = preferOrder.every(id => modes.find(m => m.id === id));
    const chosen = [];
    if (hasPrefer) preferOrder.forEach(id => chosen.push(modes.find(m => m.id === id)));
    else for (let i=0;i<Math.min(4,modes.length);i++) chosen.push(modes[i]);

    buildWedges(chosen);

    const positions = ['top','right','bottom','left'];
    chosen.forEach((mode, idx) => {
      if (!mode) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ring-btn ring-${positions[idx]}`;
      btn.dataset.modeId = mode.id;
      btn.setAttribute('aria-label', `${mode.name} mode`);
      btn.innerHTML = `<span class="ring-label">${escapeHtml(mode.name)}</span>`;

      const base = mode.color || '#00AFA0';
      const bg = /^#([A-Fa-f0-9]{6})$/.test(base) ? `${base}22` : `${base}22`;
      btn.style.background = `linear-gradient(180deg, ${bg}, rgba(0,0,0,0.06))`;
      btn.style.setProperty('--mode-color', base);
      btn.style.color = getContrastColor(base);

      compassRing.appendChild(btn);
    });
  }

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

  // --- Mode dialog flow ---
  function openModeDialog(modeId) {
    const m = modes.find(x => x.id === Number(modeId));
    if (!m) return;
    currentMode = m;
    selectedActivity = null;
    if (startResetBtn) startResetBtn.disabled = true;

    const titleEl = document.getElementById('modeDialogTitle');
    const descEl = document.getElementById('dialogModeDescription');

    if (titleEl) titleEl.textContent = m.name;
    if (descEl) descEl.textContent = m.description || '';

    // populate activities
    if (dialogQuickWins) {
      const quickWins = quickWinsMap[m.id] || [];
      dialogQuickWins.innerHTML = quickWins.map(w => `
        <li>
          <span>${escapeHtml(w)}</span>
          <button class="select-activity" data-activity="${escapeHtml(w)}">Select</button>
        </li>
      `).join('');
    }

    safeShowDialog(modeDialog);
  }

  // --- Global quick wins dialog ---
  function renderGlobalQuickWins() {
    if (!globalQuickWinsList) return;
    const items = new Set();
    Object.values(quickWinsMap).forEach(arr => arr.forEach(i => items.add(i)));
    globalQuickWinsList.innerHTML = Array.from(items).map(w => `
      <li>
        <span>${escapeHtml(w)}</span>
        <button class="select-global-activity" data-activity="${escapeHtml(w)}">Select</button>
      </li>
    `).join('');
  }

  // single beginActivity implementation
  function beginActivity(record) {
    const entry = {
      timestamp: new Date().toISOString(),
      modeId: record.modeId || null,
      modeName: record.modeName || (record.modeId ? (modes.find(m=>m.id===record.modeId)||{}).name : 'Quick Win'),
      modeColor: record.modeColor || (record.modeId ? (modes.find(m=>m.id===record.modeId)||{}).color : '#00AFA0'),
      action: record.action || 'Activity'
    };
    const h = getHistory();
    h.push(entry);
    bufferedSaveHistory(h);

    // update streak (if not already recorded today)
    incrementStreakIfNeeded();
    updateStreakDisplay();

    showToast(`Activity started — ${entry.action}`);
  }

  // --- History UI ---
  function openHistoryDialog() {
    if (!historyDialog) return;
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
        return `<div class="history-entry" style="border-left-color:${entry.modeColor || '#00AFA0'}"><div class="history-entry-info"><div class="history-entry-mode">${escapeHtml(entry.modeName || 'Quick Win')}</div><div class="history-entry-time">${d.toLocaleString()}</div><div class="history-entry-action">${escapeHtml(entry.action)}</div></div></div>`;
      }).join('') : '<div class="empty-history">No reset history yet. Start your first reset!</div>';
    }

    safeShowDialog(historyDialog);
  }

  function exportHistory() {
    const data = JSON.stringify(getHistory(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reset-compass-history-${todayKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function clearHistory() {
    if (!confirm('Clear all reset history? This cannot be undone.')) return;
    historyCache = [];
    try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
    try { safeCloseDialog(historyDialog); } catch (e) {}
    showToast('History cleared');
  }

  // --- UI utilities ---
  function showToast(text, ms = 1400) {
    const el = document.createElement('div');
    el.className = 'rc-toast';
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 240); }, ms);
  }

  // --- Theme ---
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

  // --- Event listeners (delegated and guarded) ---
  function setupEventListeners() {
    // Delegation for mode-cards, ring buttons, and activity selection
    document.addEventListener('click', function(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      // Mode card
      const card = e.target.closest('.mode-card');
      if (card && card.dataset && card.dataset.modeId) {
        openModeDialog(Number(card.dataset.modeId));
        return;
      }

      // Ring button
      const ringBtn = e.target.closest('.ring-btn');
      if (ringBtn && ringBtn.dataset && ringBtn.dataset.modeId) {
        openModeDialog(Number(ringBtn.dataset.modeId));
        return;
      }

      // Select activity inside mode dialog
      const selBtn = e.target.closest('.select-activity');
      if (selBtn && selBtn.dataset && selBtn.dataset.activity) {
        e.preventDefault();
        selectedActivity = selBtn.dataset.activity;
        // visual highlight
        if (dialogQuickWins) {
          dialogQuickWins.querySelectorAll('.select-activity').forEach(b => b.classList.remove('active'));
          selBtn.classList.add('active');
        }
        if (startResetBtn) startResetBtn.disabled = false;
        return;
      }

      // Select activity inside global quick wins
      const gSel = e.target.closest('.select-global-activity');
      if (gSel && gSel.dataset && gSel.dataset.activity) {
        e.preventDefault();
        if (globalQuickWinsList) globalQuickWinsList.querySelectorAll('.select-global-activity').forEach(b => b.classList.remove('active'));
        gSel.classList.add('active');
        if (startQuickWinBtn) {
          startQuickWinBtn.disabled = false;
          startQuickWinBtn.dataset.activity = gSel.dataset.activity;
        }
        return;
      }
    }, true /* capture early */);

    // Dialog close/cancel buttons: clear selection on close
    document.querySelectorAll('.dialog-close, .dialog-cancel').forEach(b => {
      b.addEventListener('click', (e) => {
        const d = e.target.closest('dialog');
        if (d) {
          safeCloseDialog(d);
          // clear selections when any dialog closes
          clearDialogSelections(d);
        }
      });
    });

    // startResetBtn: begin activity from mode dialog
    if (startResetBtn) {
      startResetBtn.addEventListener('click', function() {
        if (!selectedActivity || !currentMode) return;
        beginActivity({ modeId: currentMode.id, modeName: currentMode.name, modeColor: currentMode.color, action: selectedActivity });
        safeCloseDialog(modeDialog);
        clearDialogSelections(modeDialog);
      });
    }

    // startQuickWinBtn: begin activity from global quick wins
    if (startQuickWinBtn) {
      startQuickWinBtn.addEventListener('click', function() {
        const activity = startQuickWinBtn.dataset.activity;
        if (!activity) return;
        beginActivity({ action: activity });
        safeCloseDialog(quickWinsDialog);
        clearDialogSelections(quickWinsDialog);
      });
    }

    // header: history button, quick wins, theme toggle
    if (historyBtn) historyBtn.addEventListener('click', openHistoryDialog);
    if (quickWinsBtn) quickWinsBtn.addEventListener('click', () => { if (quickWinsDialog) safeShowDialog(quickWinsDialog); });
    if (themeToggle) themeToggle.addEventListener('click', () => setTheme(document.documentElement.classList.contains('light') ? 'dark' : 'light'));

    // export/clear
    const exportBtn = document.getElementById('exportHistoryBtn'); if (exportBtn) exportBtn.addEventListener('click', exportHistory);
    const clearBtn = document.getElementById('clearHistoryBtn'); if (clearBtn) clearBtn.addEventListener('click', clearHistory);

    // keyboard: open focused cards with Enter/Space; Esc closes
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        safeCloseDialog(modeDialog);
        safeCloseDialog(historyDialog);
        safeCloseDialog(quickWinsDialog);
        clearDialogSelections();
      } else if (e.key === 'Enter' || e.key === ' ') {
        const active = document.activeElement;
        if (active) {
          if (active.classList.contains('mode-card') || active.classList.contains('ring-btn')) {
            const id = Number(active.dataset.modeId);
            if (id) { e.preventDefault(); openModeDialog(id); }
          }
        }
      }
    });

    // scroll arrow rotation (passive + rAF)
    if (!prefersReducedMotion && compassArrow) {
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

    // when any native dialog closes, clear selections (for browsers that support event)
    ['modeDialog','quickWinsDialog','historyDialog'].forEach(id => {
      const d = document.getElementById(id);
      if (d) {
        d.addEventListener('close', () => clearDialogSelections(d));
      }
    });
  }

  // clear selection state when dialogs close
  function clearDialogSelections(d) {
    selectedActivity = null;
    if (dialogQuickWins) dialogQuickWins.querySelectorAll('.select-activity').forEach(b => b.classList.remove('active'));
    if (globalQuickWinsList) globalQuickWinsList.querySelectorAll('.select-global-activity').forEach(b => b.classList.remove('active'));
    if (startResetBtn) startResetBtn.disabled = true;
    if (startQuickWinBtn) {
      startQuickWinBtn.disabled = true;
      delete startQuickWinBtn.dataset.activity;
    }
    // clear currentMode only if the closed dialog was the mode dialog
    if (d === modeDialog) currentMode = null;
  }

  // --- Start / shared beginActivity wrapper ---
  function beginActivity(record) {
    // record: { modeId?, modeName?, modeColor?, action }
    const entry = {
      timestamp: new Date().toISOString(),
      modeId: record.modeId || null,
      modeName: record.modeName || (record.modeId ? (modes.find(m=>m.id===record.modeId)||{}).name : 'Quick Win'),
      modeColor: record.modeColor || (record.modeId ? (modes.find(m=>m.id===record.modeId)||{}).color : '#00AFA0'),
      action: record.action || 'Activity'
    };

    const h = getHistory();
    h.push(entry);
    bufferedSaveHistory(h);

    // streak update and toast
    incrementStreakIfNeeded();
    updateStreakDisplay();
    showToast(`Activity started — ${entry.action}`);
  }

  function setupScrollAnimation() { /* handled in setupEventListeners */ }

  function markIntroSeen() { try { if (!localStorage.getItem(INTRO_SEEN_KEY)) localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch (e) {} }

  // Start
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
