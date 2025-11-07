// Updated script.js: multi-select activities, per-activity notes, prominent quick-wins pills,
// nightly-longest streak tracking, "Daily streak" label and history longest streak display.
(function() {
  'use strict';

  // --- State ---
  let modes = [];
  let currentMode = null;

  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const INTRO_SEEN_KEY = 'resetCompassIntroSeen';
  const STREAK_KEY = 'resetCompassStreak';
  const LAST_DAY_KEY = 'resetCompassLastDay';
  const LONGEST_KEY = 'resetCompassLongest';

  const ROTATION_MULTIPLIER = 720;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let historyCache = null;
  let historyFlushTimer = null;
  const HISTORY_FLUSH_DELAY = 700;

  // Quick wins mapping (keys are mode ids)
  const quickWinsMap = {
    3: [ 'Plant your feet and do a short stretch', 'Ground with deliberate breath: 4-4-4', 'Put away one distracting item', 'Drink a glass of water' ], // Grounded
    2: [ 'Take 3 deep breaths', 'Name 3 things you notice around you', 'Lie down and relax for 2 minutes', 'Slow-release breathing for 1 minute' ], // Drifting
    4: [ 'Try one small new challenge', 'Write a short reflection on progress', 'Do a 5-minute creative exercise', 'Send an encouraging message to someone' ], // Growing
    1: [ 'Take 3 quick breaths', 'Drink water', 'Set one tiny goal for the next hour', 'Stand up and move for 60 seconds' ] // Surviving
  };

  // --- DOM refs ---
  const modesGrid = document.getElementById('modesGrid');
  const compassRing = document.getElementById('compassRing');
  const compassWedges = document.getElementById('compassWedges');
  const compassArrow = document.getElementById('compassArrow');

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

  const topQuickWinsContainer = document.getElementById('topQuickWins');
  const topCompleteSelectedBtn = document.getElementById('topCompleteSelectedBtn');

  // --- Initialization ---
  async function init() {
    applySavedTheme();
    await loadModes();
    initHistoryCache();
    updateStreakDisplay();
    renderModes();
    renderCompassRing();
    renderGlobalQuickWins();
    renderTopQuickWins();
    setupEventListeners();
    if (!prefersReducedMotion) setupScrollAnimation();
    markIntroSeen();
  }

  // Load modes (data/modes.json overrides fallback)
  async function loadModes() {
    try {
      const res = await fetch('data/modes.json');
      if (!res.ok) throw new Error('Modes load failed');
      modes = await res.json();
      if (!modes || !Array.isArray(modes) || modes.length === 0) throw new Error('No modes in file');
    } catch (e) {
      // Fallback order requested: Growing, Grounded, Drifting, Surviving
      modes = [
        { id: 4, name: 'Growing',   description: 'Small wins to build momentum', color:'#4DA6FF' },
        { id: 3, name: 'Grounded',  description: 'Reset and connect — root into the present', color:'#2ECC71' },
        { id: 2, name: 'Drifting',  description: 'Slow down and regain clarity', color:'#F7D154' },
        { id: 1, name: 'Surviving', description: 'Quick resets for focus and energy', color:'#FF6B6B' }
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

  // On a recorded activity, increment streak if needed and update longest
  function incrementStreakIfNeeded() {
    try {
      const lastDay = localStorage.getItem(LAST_DAY_KEY);
      const today = todayKey();
      let streak = Number(localStorage.getItem(STREAK_KEY) || 0);
      let longest = Number(localStorage.getItem(LONGEST_KEY) || 0);

      if (lastDay === today) return;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().split('T')[0];

      if (lastDay === yKey) streak = streak + 1;
      else streak = 1;

      if (streak > longest) {
        longest = streak;
        localStorage.setItem(LONGEST_KEY, String(longest));
      }

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
      if (b) b.textContent = `Daily streak — 🔥 ${streak}`;
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

  function safeShowDialog(d) {
    if (!d) return;
    if (typeof d.showModal === 'function') {
      try {
        d.showModal();
        const f = d.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (f) f.focus();
      } catch (e) {
        d.style.display = 'none';
        alert(d.textContent || 'Dialog opened');
      }
    } else {
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
      const initials = safeName.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
      return `
        <button class="mode-card" data-mode-id="${mode.id}" aria-label="Select ${safeName} mode" style="--mode-color:${color}">
          <div class="meta-top">
            <div class="mode-icon" aria-hidden="true" style="background: linear-gradient(180deg, ${color}33, transparent); color:${getContrastColor(color)}">${initials}</div>
            <div class="mode-meta">
              <div class="mode-name">${safeName}</div>
              <div class="mode-desc">${safeDesc}</div>
            </div>
          </div>
          <div class="mode-actions-row">
            <div class="mode-hint">Tap to open activities</div>
            <button class="card-begin" data-mode-id="${mode.id}" aria-label="Open ${safeName}">Open</button>
          </div>
        </button>
      `;
    }).join('');
  }

  // --- Compass ring + wedges (aligned) ---
  function renderCompassRing() {
    if (!compassRing) return;
    compassRing.innerHTML = '';

    const chosen = getPreferredRingModes();
    buildWedges(chosen);

    const portion = 360 / (chosen.length || 4);

    chosen.forEach((mode, idx) => {
      if (!mode) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ring-btn`;
      btn.dataset.modeId = mode.id;
      btn.setAttribute('aria-label', `${mode.name} mode`);

      // center of wedge (start + portion/2) and adjust for 'from -45deg' in conic gradient used below
      const centerAngle = Math.round(((idx + 0.5) * portion) - 45);
      btn.style.setProperty('--angle', `${centerAngle}deg`);

      btn.innerHTML = `<span class="ring-label">${escapeHtml(mode.name)}</span>`;

      const base = mode.color || '#00AFA0';
      const bg = /^#([A-Fa-f0-9]{6})$/.test(base) ? `${base}22` : `${base}22`;
      btn.style.background = `linear-gradient(180deg, ${bg}, rgba(0,0,0,0.06))`;
      btn.style.setProperty('--mode-color', base);
      btn.style.color = getContrastColor(base);

      compassRing.appendChild(btn);
    });
  }

  // Preferred visual order: Growing, Grounded, Drifting, Surviving
  function getPreferredRingModes() {
    const preferOrder = [4,3,2,1];
    const chosen = [];
    preferOrder.forEach(id => {
      const m = modes.find(x => x.id === id);
      if (m) chosen.push(m);
    });
    if (chosen.length < 4) {
      modes.forEach(m => {
        if (!chosen.find(x => x.id === m.id)) chosen.push(m);
      });
    }
    return chosen.slice(0,4);
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
    // Align wedges to match button centers by using 'from -45deg'
    compassWedges.style.background = `conic-gradient(from -45deg, ${entries.join(',')})`;
  }

  // --- Mode dialog: multi-select with per-activity notes ---
  function openModeDialog(modeId) {
    const m = modes.find(x => x.id === Number(modeId));
    if (!m) return;
    currentMode = m;
    if (startResetBtn) startResetBtn.disabled = true;

    const titleEl = document.getElementById('modeDialogTitle');
    const descEl = document.getElementById('dialogModeDescription');

    if (titleEl) titleEl.textContent = m.name;
    if (descEl) descEl.textContent = m.description || '';

    // populate activities with per-activity note placeholders
    if (dialogQuickWins) {
      const quickWins = quickWinsMap[m.id] || [];
      dialogQuickWins.innerHTML = quickWins.map(w => `
        <li>
          <div class="activity-row">
            <span>${escapeHtml(w)}</span>
            <div>
              <button class="select-activity" data-activity="${escapeHtml(w)}">Select</button>
            </div>
          </div>
          <textarea class="activity-note" data-activity="${escapeHtml(w)}" placeholder="Notes (optional)"></textarea>
        </li>
      `).join('');
    }

    safeShowDialog(modeDialog);
  }

  // --- Global quick wins rendering (dialog) ---
  function renderGlobalQuickWins() {
    if (!globalQuickWinsList) return;
    const items = new Set();
    Object.values(quickWinsMap).forEach(arr => arr.forEach(i => items.add(i)));
    globalQuickWinsList.innerHTML = Array.from(items).map(w => `
      <li>
        <div class="activity-row">
          <span>${escapeHtml(w)}</span>
          <div>
            <button class="select-global-activity" data-activity="${escapeHtml(w)}">Select</button>
          </div>
        </div>
        <textarea class="activity-note" data-activity="${escapeHtml(w)}" placeholder="Notes (optional)"></textarea>
      </li>
    `).join('');
  }

  // --- Top quick wins prominent pills ---
  function renderTopQuickWins() {
    if (!topQuickWinsContainer) return;
    const items = [];
    Object.values(quickWinsMap).forEach(arr => arr.forEach(i => {
      if (!items.includes(i)) items.push(i);
    }));
    const top = items.slice(0,4);
    topQuickWinsContainer.innerHTML = top.map((w, i) => `
      <div class="quick-win-pill" role="listitem" data-activity="${escapeHtml(w)}">
        <div class="pill-title">${escapeHtml(w)}</div>
        <button class="pill-action" data-activity="${escapeHtml(w)}">Toggle</button>
      </div>
    `).join('');

    // disable topCompleteSelected until at least one pill is active
    if (topCompleteSelectedBtn) topCompleteSelectedBtn.disabled = true;
  }

  // Record multiple activities as separate history entries
  function recordActivities(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return;
    const h = getHistory();
    entries.forEach(record => {
      const entry = {
        timestamp: new Date().toISOString(),
        modeId: record.modeId || null,
        modeName: record.modeName || (record.modeId ? (modes.find(m=>m.id===record.modeId)||{}).name : 'Quick Win'),
        modeColor: record.modeColor || (record.modeId ? (modes.find(m=>m.id===record.modeId)||{}).color : '#00AFA0'),
        action: record.action || 'Activity',
        note: record.note || ''
      };
      h.push(entry);
    });
    bufferedSaveHistory(h);

    // increment streak once per session of recorded activities
    incrementStreakIfNeeded();
    updateStreakDisplay();

    showToast(`${entries.length} activity${entries.length>1?'ies':'y'} recorded`);
  }

  // --- History UI (now includes longest streak) ---
  function openHistoryDialog() {
    if (!historyDialog) return;
    const history = getHistory();
    const statsEl = document.getElementById('historyStats');
    const timelineEl = document.getElementById('historyTimeline');

    const modeStats = {};
    modes.forEach(m => modeStats[m.id] = { count: 0, name: m.name, color: m.color });
    history.forEach(h => { if (modeStats[h.modeId]) modeStats[h.modeId].count++; });

    const total = history.length;
    const longest = Number(localStorage.getItem(LONGEST_KEY) || 0);

    if (statsEl) {
      statsEl.innerHTML = `<div class="stat-card"><span class="stat-value">${total}</span><span class="stat-label">Total Resets</span></div>` +
        `<div class="stat-card"><span class="stat-value">${longest}</span><span class="stat-label">Longest daily streak</span></div>` +
        modes.map(m => {
          const pct = total ? Math.round((modeStats[m.id].count / total) * 100) : 0;
          return `<div class="stat-card"><span class="stat-value" style="color:${m.color}">${pct}%</span><span class="stat-label">${escapeHtml(m.name)}</span></div>`;
        }).join('');
    }

    if (timelineEl) {
      timelineEl.innerHTML = history.length ? history.slice().reverse().map(entry => {
        const d = new Date(entry.timestamp);
        return `<div class="history-entry" style="border-left-color:${entry.modeColor || '#00AFA0'}"><div class="history-entry-info"><div class="history-entry-mode">${escapeHtml(entry.modeName || 'Quick Win')}</div><div class="history-entry-time">${d.toLocaleString()}</div><div class="history-entry-action">${escapeHtml(entry.action)}</div>${entry.note ? `<div class="history-entry-note">${escapeHtml(entry.note)}</div>` : ''}</div></div>`;
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

  // --- Event listeners ---
  function setupEventListeners() {
    // Delegation for mode-cards, ring buttons, quick-win pills and activity selection
    document.addEventListener('click', function(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      // pill toggle
      const pill = e.target.closest('.quick-win-pill');
      if (pill && pill.dataset && pill.dataset.activity) {
        pill.classList.toggle('active');
        updateTopCompleteButton();
        return;
      }
      const pillAction = e.target.closest('.pill-action');
      if (pillAction && pillAction.dataset && pillAction.dataset.activity) {
        const p = pillAction.closest('.quick-win-pill');
        if (p) { p.classList.toggle('active'); updateTopCompleteButton(); }
        return;
      }

      // top "Complete Selected" clicked
      if (e.target.id === 'topCompleteSelectedBtn') {
        const selected = Array.from(document.querySelectorAll('.quick-win-pill.active')).map(p => p.dataset.activity).filter(Boolean);
        if (!selected.length) return;
        openQuickWinsDialogWithActivities(selected);
        return;
      }

      // card-begin/open CTA has priority
      const cbtn = e.target.closest('.card-begin');
      if (cbtn && cbtn.dataset && cbtn.dataset.modeId) {
        openModeDialog(Number(cbtn.dataset.modeId));
        return;
      }

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

      // Select activity inside mode dialog (toggle, multi-select)
      const selBtn = e.target.closest('.select-activity');
      if (selBtn && selBtn.dataset && selBtn.dataset.activity) {
        e.preventDefault();
        selBtn.classList.toggle('active');
        const li = selBtn.closest('li');
        if (li) {
          const ta = li.querySelector('.activity-note');
          if (ta) ta.classList.toggle('visible', selBtn.classList.contains('active'));
        }
        // enable complete when at least one selected
        if (startResetBtn) startResetBtn.disabled = dialogQuickWins && dialogQuickWins.querySelectorAll('.select-activity.active').length === 0;
        return;
      }

      // Select activity inside global quick wins (toggle, multi-select)
      const gSel = e.target.closest('.select-global-activity');
      if (gSel && gSel.dataset && gSel.dataset.activity) {
        e.preventDefault();
        gSel.classList.toggle('active');
        const li = gSel.closest('li');
        if (li) {
          const ta = li.querySelector('.activity-note');
          if (ta) ta.classList.toggle('visible', gSel.classList.contains('active'));
        }
        if (startQuickWinBtn) startQuickWinBtn.disabled = globalQuickWinsList && globalQuickWinsList.querySelectorAll('.select-global-activity.active').length === 0;
        return;
      }
    }, true /* capture early */);

    // Dialog close/cancel buttons: clear selection on close
    document.querySelectorAll('.dialog-close, .dialog-cancel').forEach(b => {
      b.addEventListener('click', (e) => {
        const d = e.target.closest('dialog');
        if (d) {
          safeCloseDialog(d);
          clearDialogSelections(d);
        }
      });
    });

    // startResetBtn: complete selected activities from mode dialog
    if (startResetBtn) {
      startResetBtn.addEventListener('click', function() {
        if (!dialogQuickWins) return;
        const selectedBtns = Array.from(dialogQuickWins.querySelectorAll('.select-activity.active'));
        if (!selectedBtns.length) return;
        const records = selectedBtns.map(b => {
          const li = b.closest('li');
          const noteEl = li ? li.querySelector('.activity-note') : null;
          return {
            modeId: currentMode.id,
            modeName: currentMode.name,
            modeColor: currentMode.color,
            action: b.dataset.activity,
            note: noteEl ? (noteEl.value || '').trim() : ''
          };
        });
        recordActivities(records);
        safeCloseDialog(modeDialog);
        clearDialogSelections(modeDialog);
      });
    }

    // startQuickWinBtn: complete selected quick wins (multiple)
    if (startQuickWinBtn) {
      startQuickWinBtn.addEventListener('click', function() {
        if (!globalQuickWinsList) return;
        const selectedBtns = Array.from(globalQuickWinsList.querySelectorAll('.select-global-activity.active'));
        if (!selectedBtns.length) return;
        const records = selectedBtns.map(b => {
          const li = b.closest('li');
          const noteEl = li ? li.querySelector('.activity-note') : null;
          return {
            modeId: null,
            action: b.dataset.activity,
            note: noteEl ? (noteEl.value || '').trim() : ''
          };
        });
        recordActivities(records);
        safeCloseDialog(quickWinsDialog);
        clearDialogSelections(quickWinsDialog);
      });
    }

    // header: history button, quick wins, theme toggle
    if (historyBtn) historyBtn.addEventListener('click', openHistoryDialog);
    if (quickWinsBtn) quickWinsBtn.addEventListener('click', () => { if (quickWinsDialog) safeShowDialog(quickWinsDialog); });
    if (themeToggle) themeToggle.addEventListener('click', () => setTheme(document.documentElement.classList.contains('light') ? 'dark' : 'light'));

    // topCompleteSelectedBtn action (handled as delegated earlier)
    if (topCompleteSelectedBtn) {
      topCompleteSelectedBtn.addEventListener('click', () => {
        const selected = Array.from(document.querySelectorAll('.quick-win-pill.active')).map(p => p.dataset.activity).filter(Boolean);
        if (selected.length) openQuickWinsDialogWithActivities(selected);
      });
    }

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

    // native dialog close event cleanup
    ['modeDialog','quickWinsDialog','historyDialog'].forEach(id => {
      const d = document.getElementById(id);
      if (d) {
        d.addEventListener('close', () => clearDialogSelections(d));
      }
    });
  }

  // Open quick-wins dialog and preselect multiple activities
  function openQuickWinsDialogWithActivities(activities) {
    if (!quickWinsDialog) return;
    safeShowDialog(quickWinsDialog);
    renderGlobalQuickWins();
    setTimeout(() => {
      if (!globalQuickWinsList) return;
      // Toggle matching buttons active and reveal notes
      globalQuickWinsList.querySelectorAll('.select-global-activity').forEach(b => {
        if (activities.includes(b.dataset.activity)) {
          b.classList.add('active');
          const li = b.closest('li');
          if (li) {
            const ta = li.querySelector('.activity-note');
            if (ta) ta.classList.add('visible');
          }
        }
      });
      if (startQuickWinBtn) {
        startQuickWinBtn.disabled = globalQuickWinsList.querySelectorAll('.select-global-activity.active').length === 0;
      }
    }, 60);
  }

  // clear selection state when dialogs close
  function clearDialogSelections(d) {
    if (dialogQuickWins) {
      dialogQuickWins.querySelectorAll('.select-activity').forEach(b => b.classList.remove('active'));
      dialogQuickWins.querySelectorAll('.activity-note').forEach(t => t.classList.remove('visible'));
      dialogQuickWins.querySelectorAll('.activity-note').forEach(t => t.value = '');
    }
    if (globalQuickWinsList) {
      globalQuickWinsList.querySelectorAll('.select-global-activity').forEach(b => b.classList.remove('active'));
      globalQuickWinsList.querySelectorAll('.activity-note').forEach(t => t.classList.remove('visible'));
      globalQuickWinsList.querySelectorAll('.activity-note').forEach(t => t.value = '');
    }
    if (startResetBtn) startResetBtn.disabled = true;
    if (startQuickWinBtn) {
      startQuickWinBtn.disabled = true;
      delete startQuickWinBtn.dataset.activity;
    }
    if (d === modeDialog) currentMode = null;

    // reset top quick-wins selection and button state
    if (d === quickWinsDialog || d === modeDialog) {
      updateTopCompleteButton();
      if (topQuickWinsContainer) {
        // leave top pill selection as-is; user can decide
      }
    }
  }

  function updateTopCompleteButton() {
    if (!topCompleteSelectedBtn) return;
    const any = document.querySelectorAll('.quick-win-pill.active').length > 0;
    topCompleteSelectedBtn.disabled = !any;
  }

  function setupScrollAnimation() { /* handled in setupEventListeners */ }

  function markIntroSeen() { try { if (!localStorage.getItem(INTRO_SEEN_KEY)) localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch (e) {} }

  // Start
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();