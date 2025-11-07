// Script updates:
// - Force canonical mode names by id so "Exploring" will be shown as "Drifting"
// - Remove quick-wins listing on the homepage (Quick Wins are only accessible from header button)
// - Replace em dash text with colon or plain punctuation
// - Keep responsive ring labels and smoother arrow animation

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

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let historyCache = null;
  let historyFlushTimer = null;
  const HISTORY_FLUSH_DELAY = 700;

  // arrow animation state
  let targetAngle = 0;
  let currentAngle = 0;
  let arrowAnimating = false;

  // Quick wins mapping (keys are mode ids) - unchanged
  const quickWinsMap = {
    3: [ 'Plant your feet and do a short stretch', 'Ground with deliberate breath: 4 4 4', 'Put away one distracting item', 'Drink a glass of water' ],
    2: [ 'Take 3 deep breaths', 'Name 3 things you notice around you', 'Lie down and relax for 2 minutes', 'Slow-release breathing for 1 minute' ],
    4: [ 'Try one small new challenge', 'Write a short reflection on progress', 'Do a 5-minute creative exercise', 'Send an encouraging message to someone' ],
    1: [ 'Take 3 quick breaths', 'Drink water', 'Set one tiny goal for the next hour', 'Stand up and move for 60 seconds' ]
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

  // canonical names keyed by id to guarantee visual consistency
  const canonicalNames = {
    4: 'Growing',
    3: 'Grounded',
    2: 'Drifting',
    1: 'Surviving'
  };

  // --- Initialization ---
  async function init() {
    applySavedTheme();
    await loadModes();
    initHistoryCache();
    updateStreakDisplay();
    renderModes();
    renderCompassRing();
    renderGlobalQuickWins(); // quick wins dialog still available from header
    setupEventListeners();
    if (!prefersReducedMotion) startArrowAnimationLoop();
    markIntroSeen();
  }

  // Load modes and force canonical names and canonical order
  async function loadModes() {
    try {
      const res = await fetch('data/modes.json');
      if (!res.ok) throw new Error('Modes load failed');
      const loaded = await res.json();
      if (loaded && Array.isArray(loaded) && loaded.length) {
        modes = loaded;
      } else {
        throw new Error('No modes in file');
      }
    } catch (e) {
      modes = [
        { id: 4, name: 'Growing', description: 'Small wins to build momentum', color:'#4DA6FF' },
        { id: 3, name: 'Grounded', description: 'Reset and connect - root into the present', color:'#2ECC71' },
        { id: 2, name: 'Drifting', description: 'Slow down and regain clarity', color:'#F7D154' },
        { id: 1, name: 'Surviving', description: 'Quick resets for focus and energy', color:'#FF6B6B' }
      ];
    }

    // Force canonical name per id (overrides any upstream label like "Exploring")
    modes = modes.map(m => {
      const id = Number(m.id);
      const canonical = canonicalNames[id];
      return Object.assign({}, m, { id, name: canonical || m.name });
    });

    // Reorder to canonical visual order
    const preferOrder = [4,3,2,1];
    const ordered = [];
    preferOrder.forEach(id => {
      const found = modes.find(x => Number(x.id) === id);
      if (found) ordered.push(found);
    });
    modes.forEach(m => { if (!ordered.find(o => o.id === m.id)) ordered.push(m); });
    modes = ordered;
  }

  // --- History / Streak management ---
  function initHistoryCache() { try { historyCache = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { historyCache = []; } }
  function bufferedSaveHistory(latest) { historyCache = latest; if (historyFlushTimer) clearTimeout(historyFlushTimer); historyFlushTimer = setTimeout(() => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(historyCache || [])); } catch (e) { console.warn('Failed to save history', e); } historyFlushTimer = null; }, HISTORY_FLUSH_DELAY); }
  function getHistory() { if (historyCache === null) initHistoryCache(); return historyCache || []; }
  function todayKey() { return new Date().toISOString().split('T')[0]; }

  function incrementStreakIfNeeded() {
    try {
      const lastDay = localStorage.getItem(LAST_DAY_KEY);
      const today = todayKey();
      let streak = Number(localStorage.getItem(STREAK_KEY) || 0);
      let longest = Number(localStorage.getItem(LONGEST_KEY) || 0);

      if (lastDay === today) return;

      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
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
    } catch (e) { console.warn('streak update failed', e); }
  }

  function updateStreakDisplay() {
    const streak = Number(localStorage.getItem(STREAK_KEY) || 0);
    streakBadges.forEach(b => { if (b) b.textContent = `Daily streak: 🔥 ${streak}`; });
  }

  // --- Helpers ---
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function getContrastColor(hex) { if (!hex) return '#fff'; const h = hex.replace('#','').trim(); const r = parseInt(h.length===3? h[0]+h[0] : h.slice(0,2),16); const g = parseInt(h.length===3? h[1]+h[1] : h.slice(h.length===3?1:2, h.length===3?2:4),16); const b = parseInt(h.length===3? h[2]+h[2] : h.slice(h.length===3?2:4, h.length),16); const luminance = (0.299*r + 0.587*g + 0.114*b); return luminance > 186 ? '#000' : '#fff'; }

  function safeShowDialog(d) {
    if (!d) return;
    if (typeof d.showModal === 'function') {
      try { d.showModal(); const f = d.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (f) f.focus(); } catch (e) { d.style.display = 'none'; alert(d.textContent || 'Dialog opened'); }
    } else { const title = d.querySelector('h2') ? d.querySelector('h2').textContent : ''; const txt = Array.from(d.querySelectorAll('p, li')).map(n => n.textContent.trim()).filter(Boolean).join('\n'); alert((title ? title + '\n\n' : '') + txt); }
  }
  function safeCloseDialog(d) { if (!d) return; try { if (typeof d.close === 'function' && d.open) d.close(); } catch (e) {} }

  // --- Render modes grid and ring ---
  function renderModes() {
    if (!modesGrid) return;
    if (!Array.isArray(modes) || modes.length === 0) { modesGrid.innerHTML = '<p class="no-js-message">No modes available.</p>'; return; }
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

  function getPreferredRingModes() {
    const preferOrder = [4,3,2,1];
    const chosen = [];
    preferOrder.forEach(id => {
      const m = modes.find(x => Number(x.id) === id);
      if (m) chosen.push(m);
    });
    if (chosen.length < 4) modes.forEach(m => { if (!chosen.find(x => x.id === m.id)) chosen.push(m); });
    return chosen.slice(0,4);
  }

  function buildWedges(chosenModes) {
    if (!compassWedges) return;
    const N = chosenModes.length || 0;
    if (N === 0) { compassWedges.style.background = 'transparent'; return; }
    const portion = 360 / N;
    const entries = chosenModes.map((m, i) => {
      const color = (m && m.color) ? m.color : '#00AFA0';
      const stopColor = /^#([A-Fa-f0-9]{6})$/.test(color) ? color + '22' : color;
      const start = Math.round(i * portion);
      const end = Math.round((i + 1) * portion);
      return `${stopColor} ${start}deg ${end}deg`;
    });
    compassWedges.style.background = `conic-gradient(from -45deg, ${entries.join(',')})`;
  }

  // --- Mode dialog ---
  function openModeDialog(modeId) {
    const m = modes.find(x => x.id === Number(modeId));
    if (!m) return;
    currentMode = m;
    if (startResetBtn) startResetBtn.disabled = true;

    const titleEl = document.getElementById('modeDialogTitle');
    const descEl = document.getElementById('dialogModeDescription');

    if (titleEl) titleEl.textContent = m.name;
    if (descEl) descEl.textContent = (m.description || '').replace(/\u2014/g, ':');

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

  // --- Quick wins dialog rendering (header opens this only) ---
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

  // --- Record activities ---
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
    incrementStreakIfNeeded();
    updateStreakDisplay();
    showToast(`${entries.length} activity${entries.length>1?'ies':'y'} recorded`);
  }

  // --- History ---
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

  function exportHistory() { const data = JSON.stringify(getHistory(), null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `reset-compass-history-${todayKey()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
  function clearHistory() { if (!confirm('Clear all reset history? This cannot be undone.')) return; historyCache = []; try { localStorage.removeItem(HISTORY_KEY); } catch (e) {} try { safeCloseDialog(historyDialog); } catch (e) {} showToast('History cleared'); }

  // --- UI utilities ---
  function showToast(text, ms = 1400) { const el = document.createElement('div'); el.className = 'rc-toast'; el.textContent = text; document.body.appendChild(el); requestAnimationFrame(() => el.classList.add('visible')); setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 240); }, ms); }

  // --- Theme ---
  function applySavedTheme() { const saved = localStorage.getItem(THEME_KEY); const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches; const theme = saved || (prefersLight ? 'light' : 'dark'); setTheme(theme); }
  function setTheme(name) { if (name === 'light') document.documentElement.classList.add('light'); else document.documentElement.classList.remove('light'); try { localStorage.setItem(THEME_KEY, name); } catch (e) {} if (themeToggle) themeToggle.setAttribute('aria-pressed', name === 'light'); if (themeIcon) themeIcon.textContent = name === 'light' ? '☀️' : '🌙'; }

  // --- Event listeners ---
  function setupEventListeners() {
    document.addEventListener('click', function(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      // Mode Open CTA or card
      const cbtn = e.target.closest('.card-begin[data-mode-id]');
      if (cbtn && cbtn.dataset && cbtn.dataset.modeId) { openModeDialog(Number(cbtn.dataset.modeId)); return; }
      const card = e.target.closest('.mode-card[data-mode-id]');
      if (card && card.dataset && card.dataset.modeId) { openModeDialog(Number(card.dataset.modeId)); return; }

      // Ring button
      const ringBtn = e.target.closest('.ring-btn');
      if (ringBtn && ringBtn.dataset && ringBtn.dataset.modeId) { openModeDialog(Number(ringBtn.dataset.modeId)); return; }

      // Header Quick Wins opens full dialog (Quick Wins are not listed on homepage)
      if (e.target.id === 'quickWinsBtn' || e.target.closest('#quickWinsBtn')) { if (quickWinsDialog) safeShowDialog(quickWinsDialog); return; }

      // Dialog activity selection
      const selBtn = e.target.closest('.select-activity');
      if (selBtn && selBtn.dataset && selBtn.dataset.activity) {
        e.preventDefault();
        selBtn.classList.toggle('active');
        const li = selBtn.closest('li');
        if (li) { const ta = li.querySelector('.activity-note'); if (ta) ta.classList.toggle('visible', selBtn.classList.contains('active')); }
        if (startResetBtn) startResetBtn.disabled = dialogQuickWins && dialogQuickWins.querySelectorAll('.select-activity.active').length === 0;
        return;
      }

      const gSel = e.target.closest('.select-global-activity');
      if (gSel && gSel.dataset && gSel.dataset.activity) {
        e.preventDefault();
        gSel.classList.toggle('active');
        const li = gSel.closest('li');
        if (li) { const ta = li.querySelector('.activity-note'); if (ta) ta.classList.toggle('visible', gSel.classList.contains('active')); }
        if (startQuickWinBtn) startQuickWinBtn.disabled = globalQuickWinsList && globalQuickWinsList.querySelectorAll('.select-global-activity.active').length === 0;
        return;
      }

      // Header history
      if (e.target.id === 'historyBtn' || e.target.closest('#historyBtn')) { openHistoryDialog(); return; }

    }, true);

    // Dialog close/cancel cleanup
    document.querySelectorAll('.dialog-close, .dialog-cancel').forEach(b => {
      b.addEventListener('click', (e) => { const d = e.target.closest('dialog'); if (d) { safeCloseDialog(d); clearDialogSelections(d); } });
    });

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

    if (themeToggle) themeToggle.addEventListener('click', () => setTheme(document.documentElement.classList.contains('light') ? 'dark' : 'light'));

    const exportBtn = document.getElementById('exportHistoryBtn'); if (exportBtn) exportBtn.addEventListener('click', exportHistory);
    const clearBtn = document.getElementById('clearHistoryBtn'); if (clearBtn) clearBtn.addEventListener('click', clearHistory);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { safeCloseDialog(modeDialog); safeCloseDialog(historyDialog); safeCloseDialog(quickWinsDialog); clearDialogSelections(); }
    });

    window.addEventListener('resize', () => { renderCompassRing(); });
  }

  function openQuickWinsDialogWithActivities(activities) {
    if (!quickWinsDialog) return;
    safeShowDialog(quickWinsDialog);
    renderGlobalQuickWins();
    setTimeout(() => {
      if (!globalQuickWinsList) return;
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
      if (startQuickWinBtn) startQuickWinBtn.disabled = globalQuickWinsList.querySelectorAll('.select-global-activity.active').length === 0;
    }, 60);
  }

  function clearDialogSelections(d) {
    if (dialogQuickWins) { dialogQuickWins.querySelectorAll('.select-activity').forEach(b => b.classList.remove('active')); dialogQuickWins.querySelectorAll('.activity-note').forEach(t => t.classList.remove('visible')); dialogQuickWins.querySelectorAll('.activity-note').forEach(t => t.value = ''); }
    if (globalQuickWinsList) { globalQuickWinsList.querySelectorAll('.select-global-activity').forEach(b => b.classList.remove('active')); globalQuickWinsList.querySelectorAll('.activity-note').forEach(t => t.classList.remove('visible')); globalQuickWinsList.querySelectorAll('.activity-note').forEach(t => t.value = ''); }
    if (startResetBtn) startResetBtn.disabled = true;
    if (startQuickWinBtn) { startQuickWinBtn.disabled = true; delete startQuickWinBtn.dataset.activity; }
    if (d === modeDialog) currentMode = null;
  }

  // --- Smooth arrow animation (lerp) ---
  function startArrowAnimationLoop() {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) : 0;
      // use one rotation over full scroll for smoothness
      targetAngle = pct * 360;
      if (!arrowAnimating) { arrowAnimating = true; requestAnimationFrame(animateArrow); }
    }

    window.addEventListener('scroll', () => { requestAnimationFrame(onScroll); }, { passive: true });

    function animateArrow() {
      currentAngle += (targetAngle - currentAngle) * 0.12;
      if (compassArrow) compassArrow.style.transform = `translate(-50%, -50%) rotate(${currentAngle}deg)`;
      if (Math.abs(targetAngle - currentAngle) > 0.01) requestAnimationFrame(animateArrow);
      else arrowAnimating = false;
    }

    onScroll();
  }

  function markIntroSeen() { try { if (!localStorage.getItem(INTRO_SEEN_KEY)) localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch (e) {} }

  // Start
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();