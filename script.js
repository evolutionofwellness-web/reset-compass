// Updated script.js — per-mode translucent accents, About page, theme persistence, subtle arrow spin
(function() {
  'use strict';

  let modes = [];
  let currentMode = null;
  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const INTRO_SEEN_KEY = 'resetCompassIntroSeen';

  // Subtle decorative spin: 720 degrees across the page (two full rotations)
  const ROTATION_MULTIPLIER = 720;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  const compassArrow = document.getElementById('compassArrow');
  const compassImage = document.getElementById('compassImage');
  const historyBtn = document.getElementById('historyBtn');
  const replayBtn = document.getElementById('replayBtn');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  async function init() {
    try {
      applySavedTheme();
      await loadModes();
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

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

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

  // Render mode cards (name & description primary). Apply per-mode color via --mode-color on the card.
  function renderModes() {
    if (!modesGrid) return;
    if (!Array.isArray(modes) || modes.length === 0) {
      modesGrid.innerHTML = '<p class="no-js-message">No modes available.</p>';
      return;
    }

    modesGrid.innerHTML = modes.map(mode => {
      const safeName = escapeHtml(mode.name || 'Mode');
      const safeDesc = escapeHtml(mode.description || '');
      return `
        <button class="mode-card" data-mode-id="${mode.id}" aria-label="Select ${safeName} mode" style="--mode-color: ${mode.color || '#00AFA0'}">
          <div class="mode-meta">
            <div class="mode-name">${safeName}</div>
            <div class="mode-desc">${safeDesc}</div>
          </div>
        </button>
      `;
    }).join('');

    document.querySelectorAll('.mode-card').forEach(el => {
      const id = Number(el.dataset.modeId);
      const mode = modes.find(m => m.id === id);
      if (mode) el.style.setProperty('--mode-color', mode.color || '#00AFA0');
      el.addEventListener('click', () => openModeDialog(id));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModeDialog(id); }
      });
    });
  }

  // Render compass ring: choose up to 4 modes; use per-mode translucent overlays and ensure readable text
  function renderCompassRing() {
    if (!compassRing || !Array.isArray(modes)) return;
    compassRing.innerHTML = '';

    // prefer a stable mapping when common ids exist; otherwise use first up to 4 modes
    const preferOrder = [4,2,1,3];
    const hasPrefer = preferOrder.every(id => modes.find(m => m.id === id));
    const chosen = [];
    if (hasPrefer) {
      preferOrder.forEach(id => chosen.push(modes.find(m => m.id === id)));
    } else {
      for (let i = 0; i < Math.min(4, modes.length); i++) chosen.push(modes[i]);
    }

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
      const bg = /^#([A-Fa-f0-9]{6})$/.test(base) ? `${base}22` : `${base}22`;
      btn.style.background = `linear-gradient(180deg, ${bg}, rgba(0,0,0,0.06))`;
      btn.style.setProperty('--mode-color', base);
      btn.style.color = getContrastColor(base);

      btn.addEventListener('click', () => openModeDialog(mode.id));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModeDialog(mode.id); }
      });

      compassRing.appendChild(btn);
    });
  }

  // Open the mode modal and populate quick wins
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
      quickWinsEl.querySelectorAll('.quick-win-btn').forEach(b => b.addEventListener('click', e => startReset(e.currentTarget.dataset.win)));
    }

    if (typeof modeDialog.showModal === 'function') {
      modeDialog.showModal();
      const close = modeDialog.querySelector('.dialog-close');
      if (close) close.focus();
    } else {
      alert(`${m.name}\n\n${m.description || ''}`);
    }
  }

  // Record activity to history and notify
  function startReset(selectedAction) {
    if (!currentMode) return;
    const action = selectedAction || (quickWinsMap[currentMode.id] && quickWinsMap[currentMode.id][0]) || 'No action selected';
    const history = getHistory();
    history.push({
      timestamp: new Date().toISOString(),
      modeId: currentMode.id,
      modeName: currentMode.name,
      modeColor: currentMode.color,
      action
    });
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) { console.warn(e); }
    try { if (modeDialog.close) modeDialog.close(); } catch (e) {}
    showToast(`Activity started — ${currentMode.name}`);
  }

  function getHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { return []; } }

  // History UI
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
    localStorage.removeItem(HISTORY_KEY);
    try { if (historyDialog.close) historyDialog.close(); } catch (e) {}
    showToast('History cleared');
  }

  // small toast helper
  function showToast(text, ms = 1600) {
    const el = document.createElement('div');
    el.className = 'rc-toast';
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 240); }, ms);
  }

  // Theme handling
  function applySavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = saved || (prefersLight ? 'light' : 'dark');
    setTheme(theme);
  }
  function setTheme(name) {
    if (name === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
    localStorage.setItem(THEME_KEY, name);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', name === 'light');
    if (themeIcon) themeIcon.textContent = name === 'light' ? '☀️' : '🌙';
  }
  function toggleTheme() {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'dark' : 'light');
  }

  // Event listeners wiring
  function setupEventListeners() {
    const startBtn = document.getElementById('startResetBtn');
    if (startBtn) startBtn.addEventListener('click', () => startReset());
    document.querySelectorAll('.dialog-close, .dialog-cancel').forEach(b => b.addEventListener('click', e => {
      const d = e.target.closest('dialog'); if (d) d.close();
    }));
    if (historyBtn) historyBtn.addEventListener('click', openHistoryDialog);
    const exportBtn = document.getElementById('exportHistoryBtn'); if (exportBtn) exportBtn.addEventListener('click', exportHistory);
    const clearBtn = document.getElementById('clearHistoryBtn'); if (clearBtn) clearBtn.addEventListener('click', clearHistory);
    if (replayBtn) replayBtn.addEventListener('click', () => {
      if (prefersReducedMotion) showToast('Animations disabled (reduced motion).');
      else { if (compassImage) { compassImage.style.transform = 'scale(0.98)'; setTimeout(() => compassImage.style.transform = '', 220); } }
    });
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        try { if (modeDialog.open) modeDialog.close(); } catch (e) {}
        try { if (historyDialog.open) historyDialog.close(); } catch (e) {}
      }
    });
  }

  // Scroll-linked arrow rotation (decorative only; not user-adjustable)
  function setupScrollAnimation() {
    if (!compassArrow || prefersReducedMotion) return;
    let ticking = false;
    function update() {
      const scrollY = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? scrollY / max : 0;
      const rot = pct * ROTATION_MULTIPLIER;
      compassArrow.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
      ticking = false;
    }
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  }

  function markIntroSeen() { if (!localStorage.getItem(INTRO_SEEN_KEY)) localStorage.setItem(INTRO_SEEN_KEY, '1'); }

  // Start
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
