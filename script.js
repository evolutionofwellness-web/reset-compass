// script.js
// Key fixes in this version:
// - Force canonical names & colors so upstream can't override labels/colors
// - Render wedge colors and place the clickable mode buttons in the center of each wedge
// - Increase compass size and keep labels inside each wedge with a tighter clamp
// - Ensure mode activities are selectable and enabling the Complete button
// - Wire theme toggle across pages (multiple theme toggle controls supported)
// - Improve Quick Wins wording (done in HTML) and style history dialog
// - Add subtle animations: dialog open and streak bump/pulse when completing

(function() {
  'use strict';

  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const STREAK_KEY = 'resetCompassStreak';
  const LAST_DAY_KEY = 'resetCompassLastDay';
  const LONGEST_KEY = 'resetCompassLongest';
  const INTRO_SEEN_KEY = 'resetCompassIntroSeen';

  // DOM refs (may be absent on some pages)
  const modesGrid = document.getElementById('modesGrid');
  const compassRing = document.getElementById('compassRing');
  const compassWedges = document.getElementById('compassWedges');
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
  const themeToggles = Array.from(document.querySelectorAll('#themeToggle, #themeToggleAbout, .theme-toggle'));
  const streakBadges = document.querySelectorAll('#streakBadge');

  // Arrow rotation multiplier: 720 degrees = 2 rotations per full scroll
  const ARROW_MULTIPLIER = 720;

  // canonical modes (names + colors guaranteed)
  const canonical = {
    4: { id:4, name:'Growing',   description:'Small wins to build momentum', color:'#4DA6FF' },
    3: { id:3, name:'Grounded',  description:'Reset and connect: root into the present', color:'#2ECC71' },
    2: { id:2, name:'Drifting',  description:'Slow down and regain clarity', color:'#F7D154' },
    1: { id:1, name:'Surviving', description:'Quick resets for focus and energy', color:'#FF6B6B' }
  };

  // quick wins per mode
  const quickWinsMap = {
    3: [ 'Plant your feet and do a short stretch', 'Ground with deliberate breath: 4 4 4', 'Put away one distracting item', 'Drink a glass of water' ],
    2: [ 'Take 3 deep breaths', 'Name 3 things you notice around you', 'Lie down and relax for 2 minutes', 'Slow-release breathing for 1 minute' ],
    4: [ 'Try one small new challenge', 'Write a short reflection on progress', 'Do a 5-minute creative exercise', 'Send an encouraging message to someone' ],
    1: [ 'Take 3 quick breaths', 'Drink water', 'Set one tiny goal for the next hour', 'Stand up and move for 60 seconds' ]
  };

  let modes = [];
  let currentMode = null;

  // --- Initialization ---
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

  // Load modes.json but enforce canonical name+color (allow description override only)
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
            byId[id] = {
              id,
              name: canonical[id].name,
              color: canonical[id].color,
              description: item.description ? item.description : canonical[id].description
            };
          });
          modes = [4,3,2,1].map(id => byId[id] || canonical[id]).filter(Boolean);
          return;
        }
      }
    } catch (e) {
      console.warn('modes.json not loaded, falling back to canonical', e);
    }
    modes = [canonical[4], canonical[3], canonical[2], canonical[1]];
  }

  // --- Render modes grid (cards) ---
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

  // --- Render compass wedges & clickable labels centered inside each wedge ---
  function renderCompassRing() {
    if (!compassRing) return;
    compassRing.innerHTML = '';
    buildWedges(modes);

    // compute center positions and inject ring buttons centered inside each wedge
    const portion = 360 / (modes.length || 4);
    modes.forEach((mode, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ring-btn';
      btn.dataset.modeId = mode.id;
      // angle places label in wedge center; CSS transform will rotate it back so text is horizontal
      const centerAngle = Math.round(((idx + 0.5) * portion) - 45);
      btn.style.setProperty('--angle', `${centerAngle}deg`);
      btn.innerHTML = `<span class="ring-label">${escapeHtml(mode.name)}</span>`;
      const base = mode.color || '#00AFA0';
      btn.style.background = `linear-gradient(180deg, ${base}66, rgba(0,0,0,0.08))`;
      btn.style.setProperty('--mode-color', base);
      btn.style.color = getContrastColor(base);
      btn.style.zIndex = 6;
      compassRing.appendChild(btn);
    });
  }

  // build wedge conic-gradient using canonical colors
  function buildWedges(list) {
    if (!compassWedges) return;
    const N = (list && list.length) || 0;
    if (N === 0) { compassWedges.style.background = 'transparent'; return; }
    const portion = 360 / N;
    const entries = list.map((m, i) => {
      const color = (m && m.color) ? m.color : '#00AFA0';
      const stopColor = /^#([A-Fa-f0-9]{6})$/.test(color) ? color + '66' : color;
      const start = Math.round(i * portion);
      const end = Math.round((i + 1) * portion);
      return `${stopColor} ${start}deg ${end}deg`;
    });
    compassWedges.style.background = `conic-gradient(from -45deg, ${entries.join(',')})`;
  }

  // --- Quick wins dialog list ---
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

  // --- History & streak helpers ---
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
      streakBadges.forEach(b => { b.classList.add('streak-bump'); setTimeout(()=>b.classList.remove('streak-bump'), 420); });
      return true;
    } catch (e) { console.warn(e); return false; }
  }
  function updateStreakDisplay() {
    const s = Number(localStorage.getItem(STREAK_KEY) || 0);
    streakBadges.forEach(b => { if (b) b.textContent = `Daily streak: 🔥 ${s}`; });
  }

  // --- Utility helpers ---
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

  // --- Record activities, animate completion ---
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

    // subtle pulse on the card and ring label for completed mode
    if (bumped && currentMode) {
      const ring = document.querySelector(`.ring-btn[data-mode-id="${currentMode.id}"]`);
      const card = document.querySelector(`.mode-card[data-mode-id="${currentMode.id}"]`);
      [ring, card].forEach(el => {
        if (!el) return;
        el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.2,1)' });
      });
    }

    showToast(`${entries.length} activity${entries.length>1?'ies':'y'} recorded`);
  }

  // --- Dialog helpers ---
  function safeShowDialog(d) {
    if (!d) return;
    if (typeof d.showModal === 'function') {
      try { d.showModal(); const f = d.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (f) f.focus(); } catch (e) { console.warn(e); }
    } else { alert(d.querySelector('h2') ? d.querySelector('h2').textContent : 'Dialog'); }
  }
  function safeCloseDialog(d) { if (!d) return; try { if (typeof d.close === 'function' && d.open) d.close(); } catch (e) {} }

  // --- Attach listeners and delegation ---
  function attachListeners() {
    // theme toggles across pages
    themeToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('light') ? 'dark' : 'light';
        setTheme(newTheme);
      });
    });

    document.addEventListener('click', function(e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      // mode card opening
      const modeCard = e.target.closest('.mode-card[data-mode-id]');
      if (modeCard && modeCard.dataset.modeId) { openModeDialog(Number(modeCard.dataset.modeId)); return; }

      // ring label click (inside wedge)
      const ring = e.target.closest('.ring-btn');
      if (ring && ring.dataset && ring.dataset.modeId) { openModeDialog(Number(ring.dataset.modeId)); return; }

      // quick wins open (header or under link)
      if (e.target.id === 'quickWinsBtn' || e.target.closest('#quickWinsBtn') || e.target.id === 'quickWinsLink' || e.target.closest('#quickWinsLink')) { safeShowDialog(quickWinsDialog); return; }

      // history
      if (e.target.id === 'historyBtn' || e.target.closest('#historyBtn')) { openHistoryDialog(); return; }

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

    // start quick wins completion
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

    // startResetBtn in mode dialog
    if (startResetBtn) {
      startResetBtn.addEventListener('click', function() {
        if (!dialogQuickWins) return;
        const selectedBtns = Array.from(dialogQuickWins.querySelectorAll('.select-activity.active'));
        if (!selectedBtns.length) return;
        const records = selectedBtns.map(b => {
          const li = b.closest('li'); const noteEl = li ? li.querySelector('.activity-note') : null;
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

    // keyboard escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { safeCloseDialog(modeDialog); safeCloseDialog(historyDialog); safeCloseDialog(quickWinsDialog); clearDialogSelections(); }
    });

    // resize -> re-render ring to recalc positions
    window.addEventListener('resize', function() { renderCompassRing(); });
  }

  // --- Open Mode dialog and populate activities ---
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
          <textarea class="activity-note" data-activity="${escapeHtml(w)}" placeholder="Notes (optional)" hidden></textarea>
        </li>
      `).join('');
    }

    safeShowDialog(modeDialog);
  }

  // clear UI selections inside dialogs
  function clearDialogSelections(d) {
    if (dialogQuickWins) { dialogQuickWins.querySelectorAll('.select-activity').forEach(b => b.classList.remove('active')); dialogQuickWins.querySelectorAll('.activity-note').forEach(t=>{ t.hidden=true; t.value=''; }); }
    if (globalQuickWinsList) { globalQuickWinsList.querySelectorAll('.select-global-activity').forEach(b => b.classList.remove('active')); globalQuickWinsList.querySelectorAll('.activity-note').forEach(t=>{ t.hidden=true; t.value=''; }); }
    if (startResetBtn) startResetBtn.disabled = true;
    if (startQuickWinBtn) startQuickWinBtn.disabled = true;
    if (d === modeDialog) currentMode = null;
  }

  // --- History dialog rendering with styling ---
  function openHistoryDialog() {
    if (!historyDialog) return;
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const total = history.length;
    const longest = Number(localStorage.getItem(LONGEST_KEY) || 0);

    if (historyStats) {
      historyStats.innerHTML = `
        <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total resets</div></div>
        <div class="stat-card"><div class="stat-value">${longest}</div><div class="stat-label">Longest streak</div></div>
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

  // --- Smooth arrow animation (lerp) ---
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

  // --- Theme helpers ---
  function applySavedTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(saved || (prefersLight ? 'light' : 'dark'));
  }
  function setTheme(name) {
    if (name === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
    try { localStorage.setItem(THEME_KEY, name); } catch (e) {}
    // update any theme toggle UI states (multiple controls possible)
    themeToggles.forEach(btn => btn.setAttribute('aria-pressed', name === 'light'));
    const icon = name === 'light' ? '☀️' : '🌙';
    themeToggles.forEach(btn => {
      const span = btn.querySelector('span');
      if (span) span.textContent = icon;
    });
  }

  function markIntroSeen(){ try{ if (!localStorage.getItem(INTRO_SEEN_KEY)) localStorage.setItem(INTRO_SEEN_KEY, '1'); }catch(e){} }

  // small toast
  function showToast(text, ms = 1400) {
    const el = document.createElement('div');
    el.className = 'rc-toast';
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('visible'));
    setTimeout(()=>{ el.classList.remove('visible'); setTimeout(()=>el.remove(),220); }, ms);
  }

  // Start up
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Debug helpers
  window.__rc = { renderModes, renderCompassRing, buildWedges, openModeDialog, setTheme };

})();