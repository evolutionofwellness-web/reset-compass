// script.js
// Key fixes for this update:
// - compute ring label positions using polar math and place them via left/top so labels revolve and read upright
// - stronger wedge alpha and vibrant color accents
// - navigation on About page wired via data-action across pages
// - "Complete Selected" now records, animates completed mode, and opens History dialog
// - Quick Wins CTA larger and further spaced; Quick Wins completion opens History as well
// - Added "add to home screen" instructions in About page (static HTML) — no JS required there
// - Increased compass size and mode text/button sizes

(function() {
  'use strict';

  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const STREAK_KEY = 'resetCompassStreak';
  const LAST_DAY_KEY = 'resetCompassLastDay';
  const LONGEST_KEY = 'resetCompassLongest';
  const INTRO_SEEN_KEY = 'resetCompassIntroSeen';

  const modesGrid = document.getElementById('modesGrid');
  const compassRing = document.getElementById('compassRing');
  const compassWedges = document.getElementById('compassWedges');
  const compassContainer = document.getElementById('compassContainer');
  const compassArrow = document.getElementById('compassArrow');
  const modeDialog = document.getElementById('modeDialog');
  const dialogQuickWins = document.getElementById('dialogQuickWins');
  const startResetBtn = document.getElementById('startResetBtn');
  const quickWinsDialog = document.getElementById('quickWinsDialog');
  const globalQuickWinsList = document.getElementById('globalQuickWins');
  const startQuickWinBtn = document.getElementById('startQuickWinBtn');
  const historyDialog = document.getElementById('historyDialog');
  const historyStats = document.getElementById('historyStats');
  const historyTimeline = document.getElementById('historyTimeline');
  const themeToggles = Array.from(document.querySelectorAll('.theme-toggle, #themeToggle, #themeToggleAbout'));
  const streakBadges = document.querySelectorAll('#streakBadge');

  const ARROW_MULTIPLIER = 720; // 2 rotations per full scroll

  const canonical = {
    4: { id:4, name:'Growing',   description:'Small wins to build momentum', color:'#2f80ed' },
    3: { id:3, name:'Grounded',  description:'Reset and connect: root into the present', color:'#00c06b' },
    2: { id:2, name:'Drifting',  description:'Slow down and regain clarity', color:'#ffbf3b' },
    1: { id:1, name:'Surviving', description:'Quick resets for focus and energy', color:'#ff5f6d' }
  };

  const quickWinsMap = {
    3: [ 'Plant your feet and do a short stretch', 'Ground with deliberate breath: 4 4 4', 'Put away one distracting item', 'Drink a glass of water' ],
    2: [ 'Take 3 deep breaths', 'Name 3 things you notice around you', 'Lie down and relax for 2 minutes', 'Slow-release breathing for 1 minute' ],
    4: [ 'Try one small new challenge', 'Write a short reflection on progress', 'Do a 5-minute creative exercise', 'Send an encouraging message to someone' ],
    1: [ 'Take 3 quick breaths', 'Drink water', 'Set one tiny goal for the next hour', 'Stand up and move for 60 seconds' ]
  };

  let modes = [];
  let currentMode = null;

  async function init() {
    applySavedTheme();
    await loadModes();
    renderModes();
    renderCompassRing();
    renderGlobalQuickWins();
    initHistory();
    updateStreakDisplay();
    attachListeners();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) startArrowLoop();
    markIntroSeen();
  }

  async function loadModes() {
    try {
      const res = await fetch('data/modes.json');
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          const byId = {};
          data.forEach(item => {
            const id = Number(item.id);
            if (!canonical[id]) return;
            byId[id] = { id, name: canonical[id].name, color: canonical[id].color, description: item.description ? item.description : canonical[id].description };
          });
          modes = [4,3,2,1].map(id => byId[id] || canonical[id]).filter(Boolean);
          return;
        }
      }
    } catch (e) {
      console.warn('modes.json not loaded, using canonical', e);
    }
    modes = [canonical[4], canonical[3], canonical[2], canonical[1]];
  }

  function renderModes() {
    if (!modesGrid) return;
    modesGrid.innerHTML = modes.map(m => {
      const safeName = escapeHtml(m.name);
      const safeDesc = escapeHtml(m.description || '');
      const color = m.color || '#00AFA0';
      return `
        <button class="mode-card" data-mode-id="${m.id}" style="--mode-color:${color}" aria-label="${safeName}">
          <div class="mode-meta">
            <div class="mode-name">${safeName}</div>
            <div class="mode-desc">${safeDesc}</div>
            <div class="mode-hint">Tap to open activities</div>
          </div>
        </button>
      `;
    }).join('');
  }

  // position ring labels by polar geometry, keep horizontal text
  function renderCompassRing() {
    if (!compassRing || !compassWedges || !compassContainer) return;
    compassRing.innerHTML = '';
    buildWedges(modes);

    const rect = compassContainer.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(cx, cy);

    const portion = 360 / (modes.length || 4);

    modes.forEach((mode, idx) => {
      const centerAngle = ((idx + 0.5) * portion) - 45;
      const rad = (centerAngle - 90) * (Math.PI / 180);
      let rFactor = 0.52;
      let rPx = radius * rFactor;
      const minR = Math.max(40, radius * 0.28);
      const maxR = Math.max(80, radius * 0.64);
      rPx = Math.min(Math.max(rPx, minR), maxR);
      const left = cx + Math.cos(rad) * rPx;
      const top = cy + Math.sin(rad) * rPx;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ring-btn';
      btn.dataset.modeId = mode.id;
      btn.innerHTML = `<span class="ring-label">${escapeHtml(mode.name)}</span>`;

      const base = mode.color || '#00AFA0';
      btn.style.background = `linear-gradient(180deg, ${base}CC, rgba(0,0,0,0.10))`; // stronger alpha
      btn.style.setProperty('--mode-color', base);
      btn.style.color = getContrastColor(base);

      btn.style.left = `${left}px`;
      btn.style.top = `${top}px`;
      btn.style.zIndex = 12;

      // subtle colored glow outline to pop
      btn.style.boxShadow = `0 18px 50px rgba(0,0,0,0.6), 0 0 24px ${hexToRgba(base, 0.14)}`;

      compassRing.appendChild(btn);
    });
  }

  function buildWedges(list) {
    if (!compassWedges) return;
    const N = (list && list.length) || 0;
    if (N === 0) { compassWedges.style.background = 'transparent'; return; }
    const portion = 360 / N;
    const entries = list.map((m, i) => {
      const color = (m && m.color) ? m.color : '#00AFA0';
      const stopColor = /^#([A-Fa-f0-9]{6})$/.test(color) ? color + 'CC' : color;
      const start = Math.round(i * portion);
      const end = Math.round((i + 1) * portion);
      return `${stopColor} ${start}deg ${end}deg`;
    });
    compassWedges.style.background = `conic-gradient(from -45deg, ${entries.join(',')})`;
    compassWedges.style.filter = 'saturate(1.05) contrast(1.02)';
  }

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
        <textarea class="activity-note" data-activity="${escapeHtml(w)}" placeholder="Notes (optional)" hidden></textarea>
      </li>
    `).join('');
  }

  function initHistory() { try { JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { localStorage.setItem(HISTORY_KEY, '[]'); } }
  function todayKey(){ return new Date().toISOString().split('T')[0]; }
  function incrementStreakIfNeeded() {
    try {
      const last = localStorage.getItem(LAST_DAY_KEY);
      const today = todayKey();
      let streak = Number(localStorage.getItem(STREAK_KEY) || 0);
      let longest = Number(localStorage.getItem(LONGEST_KEY) || 0);
      if (last === today) return false;
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yKey = y.toISOString().split('T')[0];
      if (last === yKey) streak = streak + 1; else streak = 1;
      if (streak > longest) localStorage.setItem(LONGEST_KEY, String(streak));
      localStorage.setItem(STREAK_KEY, String(streak));
      localStorage.setItem(LAST_DAY_KEY, today);
      updateStreakDisplay();
      streakBadges.forEach(b => { b.classList.add('streak-bump'); setTimeout(()=>b.classList.remove('streak-bump'), 520); });
      return true;
    } catch (e) { console.warn(e); return false; }
  }
  function updateStreakDisplay() {
    const s = Number(localStorage.getItem(STREAK_KEY) || 0);
    streakBadges.forEach(b => { if (b) b.textContent = `Daily streak: 🔥 ${s}`; });
  }

  function recordActivities(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return;
    let hist;
    try { hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { hist = []; }
    entries.forEach(rec => {
      hist.push({
        timestamp: new Date().toISOString(),
        modeId: rec.modeId || null,
        modeName: rec.modeName || (rec.modeId ? (modes.find(m=>m.id===rec.modeId)||{}).name : 'Quick Win'),
        modeColor: rec.modeColor || (rec.modeId ? (modes.find(m=>m.id===rec.modeId)||{}).color : '#00AFA0'),
        action: rec.action || 'Activity',
        note: rec.note || ''
      });
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));

    const bumped = incrementStreakIfNeeded();

    // animate completed mode (pulse ring + card)
    if (bumped && currentMode) {
      const ring = document.querySelector(`.ring-btn[data-mode-id="${currentMode.id}"]`);
      const card = document.querySelector(`.mode-card[data-mode-id="${currentMode.id}"]`);
      [ring, card].forEach(el => {
        if (!el) return;
        el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.2,.9,.2,1)' });
      });
    }

    showToast(`${entries.length} activity${entries.length>1?'ies':'y'} recorded`);

    // Open history after a short delay so animation is visible
    setTimeout(() => {
      openHistoryDialog();
    }, 420);
  }

  function safeShowDialog(d) {
    if (!d) return;
    if (typeof d.showModal === 'function') {
      try { d.showModal(); const f = d.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (f) f.focus(); } catch (e) { console.warn(e); }
    } else { alert(d.querySelector('h2') ? d.querySelector('h2').textContent : 'Dialog'); }
  }
  function safeCloseDialog(d) { if (!d) return; try { if (typeof d.close === 'function' && d.open) d.close(); } catch (e) {} }

  function attachListeners() {
    document.addEventListener('click', function(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      const actionEl = e.target.closest('[data-action]');
      if (actionEl && actionEl.dataset && actionEl.dataset.action) {
        const action = actionEl.dataset.action;
        if (action === 'quick-wins') { safeShowDialog(quickWinsDialog); return; }
        if (action === 'history') { openHistoryDialog(); return; }
        if (action === 'home') { window.location.href = './index.html'; return; }
        if (action === 'toggle-theme') {
          const newTheme = document.documentElement.classList.contains('light') ? 'dark' : 'light';
          setTheme(newTheme);
          return;
        }
      }

      // ring button click
      const ringBtn = e.target.closest('.ring-btn[data-mode-id]');
      if (ringBtn && ringBtn.dataset && ringBtn.dataset.modeId) { openModeDialog(Number(ringBtn.dataset.modeId)); return; }

      // mode card click
      const modeCard = e.target.closest('.mode-card[data-mode-id]');
      if (modeCard && modeCard.dataset && modeCard.dataset.modeId) { openModeDialog(Number(modeCard.dataset.modeId)); return; }

      // quick wins under section
      if (e.target.id === 'quickWinsLink' || e.target.closest('#quickWinsLink')) { safeShowDialog(quickWinsDialog); return; }

      // global quick wins select
      const gSel = e.target.closest('.select-global-activity');
      if (gSel && gSel.dataset && gSel.dataset.activity) {
        e.preventDefault();
        gSel.classList.toggle('active');
        const li = gSel.closest('li'); if (li) { const ta = li.querySelector('.activity-note'); if (ta) ta.hidden = !gSel.classList.contains('active'); }
        if (startQuickWinBtn) startQuickWinBtn.disabled = !(globalQuickWinsList.querySelectorAll('.select-global-activity.active').length > 0);
        return;
      }

      // mode dialog selection
      const selBtn = e.target.closest('.select-activity');
      if (selBtn && selBtn.dataset && selBtn.dataset.activity) {
        e.preventDefault();
        selBtn.classList.toggle('active');
        const li = selBtn.closest('li'); if (li) { const ta = li.querySelector('.activity-note'); if (ta) ta.hidden = !selBtn.classList.contains('active'); }
        if (startResetBtn) startResetBtn.disabled = !(dialogQuickWins.querySelectorAll('.select-activity.active').length > 0);
        return;
      }

      // dialog close/cancel
      if (e.target.closest('.dialog-close') || e.target.closest('.dialog-cancel')) {
        const d = e.target.closest('dialog');
        if (d) { safeCloseDialog(d); clearDialogSelections(d); }
      }
    }, true);

    if (startQuickWinBtn) {
      startQuickWinBtn.addEventListener('click', function() {
        const selected = Array.from(globalQuickWinsList.querySelectorAll('.select-global-activity.active'));
        if (!selected.length) return;
        const records = selected.map(b => {
          const li = b.closest('li'); const noteEl = li ? li.querySelector('.activity-note') : null;
          return { modeId: null, action: b.dataset.activity, note: noteEl ? (noteEl.value || '').trim() : '' };
        });
        recordActivities(records);
        safeCloseDialog(quickWinsDialog);
        clearDialogSelections(quickWinsDialog);
      });
    }

    if (startResetBtn) {
      startResetBtn.addEventListener('click', function() {
        if (!dialogQuickWins) return;
        const selectedBtns = Array.from(dialogQuickWins.querySelectorAll('.select-activity.active'));
        if (!selectedBtns.length) return;
        const records = selectedBtns.map(b => {
          const li = b.closest('li'); const noteEl = li ? li.querySelector('.activity-note') : null;
          return { modeId: currentMode.id, modeName: currentMode.name, modeColor: currentMode.color, action: b.dataset.activity, note: noteEl ? (noteEl.value || '').trim() : '' };
        });
        recordActivities(records);
        safeCloseDialog(modeDialog);
        clearDialogSelections(modeDialog);
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { safeCloseDialog(modeDialog); safeCloseDialog(historyDialog); safeCloseDialog(quickWinsDialog); clearDialogSelections(); }
    });

    window.addEventListener('resize', function() { renderCompassRing(); });
  }

  function openModeDialog(modeId) {
    const m = modes.find(x => x.id === Number(modeId));
    if (!m) return;
    currentMode = m;
    if (startResetBtn) startResetBtn.disabled = true;
    const titleEl = document.getElementById('modeDialogTitle');
    const descEl = document.getElementById('dialogModeDescription');
    const header = document.getElementById('modeDialogHeader');
    if (titleEl) titleEl.textContent = m.name;
    if (descEl) descEl.textContent = m.description || '';
    if (header) header.style.borderLeft = `6px solid ${m.color || '#00AFA0'}`;

    if (dialogQuickWins) {
      const q = quickWinsMap[m.id] || [];
      dialogQuickWins.innerHTML = q.map(w => `
        <li>
          <div class="activity-row">
            <span>${escapeHtml(w)}</span>
            <div>
              <button class="select-activity" data-activity="${escapeHtml(w)}">Select</button>
            </div>
          </div>
          <textarea class="activity-note" data-activity="${escapeHtml(w)}" placeholder="Notes (optional)" hidden></textarea>
        </li>
      `).join('');
    }

    safeShowDialog(modeDialog);
  }

  function clearDialogSelections(d) {
    if (dialogQuickWins) { dialogQuickWins.querySelectorAll('.select-activity').forEach(b => b.classList.remove('active')); dialogQuickWins.querySelectorAll('.activity-note').forEach(t=>{ t.hidden=true; t.value=''; }); }
    if (globalQuickWinsList) { globalQuickWinsList.querySelectorAll('.select-global-activity').forEach(b => b.classList.remove('active')); globalQuickWinsList.querySelectorAll('.activity-note').forEach(t=>{ t.hidden=true; t.value=''; }); }
    if (startResetBtn) startResetBtn.disabled = true;
    if (startQuickWinBtn) startQuickWinBtn.disabled = true;
    if (d === modeDialog) currentMode = null;
  }

  function openHistoryDialog() {
    if (!historyDialog) return;
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    const counts = {};
    modes.forEach(m => counts[m.name] = 0);
    history.forEach(h => {
      const name = h.modeName || 'Quick Win';
      counts[name] = (counts[name] || 0) + 1;
    });
    const total = history.length;

    if (historyStats) {
      historyStats.innerHTML = `
        <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total resets</div></div>
        <div class="stat-card"><div class="stat-value">${Number(localStorage.getItem(LONGEST_KEY) || 0)}</div><div class="stat-label">Longest streak</div></div>
        ${modes.map(m => {
          const c = counts[m.name] || 0;
          const pct = total ? Math.round((c/total)*100) : 0;
          return `<div class="stat-card" style="border-left:6px solid ${m.color};"><div class="stat-value">${c}</div><div class="stat-label">${escapeHtml(m.name)} • ${pct}%</div></div>`;
        }).join('')}
      `;
    }

    if (historyTimeline) {
      historyTimeline.innerHTML = history.length ? history.slice().reverse().map(entry => {
        const d = new Date(entry.timestamp);
        return `<div class="history-entry" style="border-left-color:${entry.modeColor || '#00AFA0'}">
          <div><strong>${escapeHtml(entry.modeName || 'Quick Win')}</strong> • ${d.toLocaleString()}<div style="margin-top:6px;color:var(--text-secondary)">${escapeHtml(entry.action)}</div>${entry.note?`<div style="margin-top:8px;color:var(--text-secondary)">${escapeHtml(entry.note)}</div>`:''}</div>
        </div>`;
      }).join('') : '<div class="empty-history">No reset history yet. Start your first reset!</div>';
    }

    safeShowDialog(historyDialog);
  }

  // arrow animation
  let targetAngle = 0, currentAngle = 0, arrowAnimating = false;
  function startArrowLoop() {
    function onScroll(){
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) : 0;
      targetAngle = pct * ARROW_MULTIPLIER;
      if (!arrowAnimating) { arrowAnimating = true; requestAnimationFrame(animate); }
    }
    window.addEventListener('scroll', () => { requestAnimationFrame(onScroll); }, { passive: true });
    function animate(){
      currentAngle += (targetAngle - currentAngle) * 0.12;
      if (compassArrow) compassArrow.style.transform = `translate(-50%,-50%) rotate(${currentAngle}deg)`;
      if (Math.abs(targetAngle - currentAngle) > 0.01) requestAnimationFrame(animate);
      else arrowAnimating = false;
    }
    onScroll();
  }

  // theme helpers
  function applySavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(saved || (prefersLight ? 'light' : 'dark'));
  }
  function setTheme(name) {
    if (name === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
    try { localStorage.setItem(THEME_KEY, name); } catch (e) {}
    themeToggles.forEach(btn => btn.setAttribute('aria-pressed', name === 'light'));
    const icon = name === 'light' ? '☀️' : '🌙';
    themeToggles.forEach(btn => { const span = btn.querySelector('span'); if (span) span.textContent = icon; });
  }

  function markIntroSeen(){ try{ if (!localStorage.getItem(INTRO_SEEN_KEY)) localStorage.setItem(INTRO_SEEN_KEY, '1'); }catch(e){} }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function getContrastColor(hex){
    if(!hex) return '#fff';
    const h = hex.replace('#','').trim();
    const r = parseInt(h.length===3? h[0]+h[0] : h.slice(0,2),16);
    const g = parseInt(h.length===3? h[1]+h[1] : h.slice(h.length===3?1:2, h.length===3?2:4),16);
    const b = parseInt(h.length===3? h[2]+h[2] : h.slice(h.length===3?2:4, h.length),16);
    const lum = (0.299*r + 0.587*g + 0.114*b);
    return lum > 186 ? '#000' : '#fff';
  }
  function hexToRgba(hex, alpha=1) {
    const h = hex.replace('#','');
    const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.__rc = { renderModes, renderCompassRing, buildWedges, openModeDialog, setTheme };

})();