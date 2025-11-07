// Updated script to:
// - force canonical full names & canonical colors (prevent upstream "Exploring" from showing)
// - render modes into the four wedges (labels are placed inside each wedge and clickable)
// - ensure left stripe colors and wedge colors use the canonical color set
// - increase compass arrow rotation multiplier to 720 (2x previous 360)
// - robust event delegation so ring labels and mode cards open the mode dialog

(function() {
  'use strict';

  // Keys
  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const STREAK_KEY = 'resetCompassStreak';
  const LAST_DAY_KEY = 'resetCompassLastDay';
  const LONGEST_KEY = 'resetCompassLongest';
  const INTRO_SEEN_KEY = 'resetCompassIntroSeen';

  // DOM refs
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
  const historyBtn = document.getElementById('historyBtn');
  const quickWinsBtn = document.getElementById('quickWinsBtn');
  const quickWinsLink = document.getElementById('quickWinsLink');
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const streakBadges = document.querySelectorAll('#streakBadge');

  // Arrow rotation multiplier — 720 degrees over full page scroll (2x the previous single-rotation).
  const ARROW_MULTIPLIER = 720;

  // canonical defaults and colors (guaranteed)
  const canonical = {
    4: { id:4, name:'Growing',   description:'Small wins to build momentum', color:'#4DA6FF' },
    3: { id:3, name:'Grounded',  description:'Reset and connect: root into the present', color:'#2ECC71' },
    2: { id:2, name:'Drifting',  description:'Slow down and regain clarity', color:'#F7D154' },
    1: { id:1, name:'Surviving', description:'Quick resets for focus and energy', color:'#FF6B6B' }
  };

  const quickWinsMap = {
    3: [ 'Plant your feet and do a short stretch', 'Ground with deliberate breath: 4 4 4', 'Put away one distracting item', 'Drink a glass of water' ],
    2: [ 'Take 3 deep breaths', 'Name 3 things you notice around you', 'Lie down and relax for 2 minutes', 'Slow-release breathing for 1 minute' ],
    4: [ 'Try one small new challenge', 'Write a short reflection on progress', 'Do a 5-minute creative exercise', 'Send an encouraging message to someone' ],
    1: [ 'Take 3 quick breaths', 'Drink water', 'Set one tiny goal for the next hour', 'Stand up and move for 60 seconds' ]
  };

  let modes = [];

  // --- init ---
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

  // load modes.json but force canonical names/colors; allow description override only
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
            // keep canonical name and color always; allow description to come from file or canonical fallback
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
      console.warn('Could not load data/modes.json, falling back to defaults', e);
    }
    modes = [canonical[4], canonical[3], canonical[2], canonical[1]];
  }

  // render mode cards (below compass)
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

  // render compass wedges and labels (labels inside each wedge)
  function renderCompassRing() {
    if (!compassRing) return;
    compassRing.innerHTML = '';
    buildWedges(modes);

    const portion = 360 / (modes.length || 4);
    modes.forEach((mode, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ring-btn';
      btn.dataset.modeId = mode.id;
      const centerAngle = Math.round(((idx + 0.5) * portion) - 45);
      btn.style.setProperty('--angle', `${centerAngle}deg`);
      btn.innerHTML = `<span class="ring-label">${escapeHtml(mode.name)}</span>`;
      const base = mode.color || '#00AFA0';
      btn.style.background = `linear-gradient(180deg, ${base}66, rgba(0,0,0,0.08))`;
      btn.style.setProperty('--mode-color', base);
      btn.style.color = getContrastColor(base);
      // make sure labels are above wedges
      btn.style.zIndex = 6;
      compassRing.appendChild(btn);
    });
  }

  // create wedge background; wedge alpha slightly stronger for labels readability
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
        <textarea class="activity-note" data-activity="${escapeHtml(w)}" placeholder="Notes (optional)"></textarea>
      </li>
    `).join('');
  }

  // --- History / streak ---
  function initHistory() {
    try { JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { localStorage.setItem(HISTORY_KEY, '[]'); }
  }
  function todayKey(){ return new Date().toISOString().split('T')[0]; }
  function incrementStreakIfNeeded(){
    try{
      const last = localStorage.getItem(LAST_DAY_KEY);
      const today = todayKey();
      let streak = Number(localStorage.getItem(STREAK_KEY) || 0);
      let longest = Number(localStorage.getItem(LONGEST_KEY) || 0);
      if (last === today) return;
      const y = new Date(); y.setDate(y.getDate()-1); const yKey = y.toISOString().split('T')[0];
      if (last === yKey) streak = streak + 1; else streak = 1;
      if (streak > longest){ localStorage.setItem(LONGEST_KEY, String(streak)); }
      localStorage.setItem(STREAK_KEY, String(streak)); localStorage.setItem(LAST_DAY_KEY, today);
      updateStreakDisplay();
    } catch(e){ console.warn(e); }
  }
  function updateStreakDisplay(){
    const s = Number(localStorage.getItem(STREAK_KEY) || 0);
    streakBadges.forEach(b => { if (b) b.textContent = `Daily streak: 🔥 ${s}`; });
  }

  // --- UI helpers ---
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

  // record activities
  function recordActivities(entries) {
    if (!Array.isArray(entries) || !entries.length) return;
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
    incrementStreakIfNeeded();
    updateStreakDisplay();
    showToast(`${entries.length} activity${entries.length>1?'ies':'y'} recorded`);
  }

  // toast
  function showToast(text, ms = 1400){ const el=document.createElement('div'); el.className='rc-toast'; el.textContent=text; document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('visible')); setTimeout(()=>{ el.classList.remove('visible'); setTimeout(()=>el.remove(),220); }, ms); }

  // dialog helpers
  function safeShowDialog(d){ if(!d) return; if(typeof d.showModal==='function'){ try{ d.showModal(); const f = d.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if(f) f.focus(); }catch(e){ alert((d.querySelector('h2')?d.querySelector('h2').textContent+'\\n\\n':'') + Array.from(d.querySelectorAll('p,li')).map(n=>n.textContent.trim()).filter(Boolean).join('\\n')); } } else { alert('Dialog not supported'); } }
  function safeCloseDialog(d){ if(!d) return; try { if(typeof d.close==='function' && d.open) d.close(); } catch(e){} }

  // attach UI listeners (delegation)
  function attachListeners(){
    document.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      // mode card
      const modeCard = e.target.closest('.mode-card[data-mode-id]');
      if (modeCard && modeCard.dataset.modeId) { openModeDialog(Number(modeCard.dataset.modeId)); return; }

      // ring label
      const ring = e.target.closest('.ring-btn');
      if (ring && ring.dataset && ring.dataset.modeId) { openModeDialog(Number(ring.dataset.modeId)); return; }

      // quick wins
      if (e.target.id === 'quickWinsBtn' || e.target.closest('#quickWinsBtn')) { safeShowDialog(quickWinsDialog); return; }
      if (e.target.id === 'quickWinsLink' || e.target.closest('#quickWinsLink')) { safeShowDialog(quickWinsDialog); return; }

      // history
      if (e.target.id === 'historyBtn' || e.target.closest('#historyBtn')) { openHistoryDialog(); return; }

      // quick-wins dialog selects
      const gSel = e.target.closest('.select-global-activity');
      if (gSel && gSel.dataset && gSel.dataset.activity) {
        e.preventDefault();
        gSel.classList.toggle('active');
        const li = gSel.closest('li');
        if (li) { const ta = li.querySelector('.activity-note'); if (ta) ta.classList.toggle('visible', gSel.classList.contains('active')); }
        if (startQuickWinBtn) startQuickWinBtn.disabled = !(globalQuickWinsList.querySelectorAll('.select-global-activity.active').length > 0);
        return;
      }

      // dialog close/cancel
      if (e.target.closest('.dialog-close') || e.target.closest('.dialog-cancel')) {
        const d = e.target.closest('dialog');
        if (d) { safeCloseDialog(d); clearDialogSelections(d); }
      }

      // theme
      if (e.target.id === 'themeToggle' || e.target.closest('#themeToggle')) {
        setTheme(document.documentElement.classList.contains('light') ? 'dark' : 'light');
      }
    }, true);

    // start quick wins action
    if (startQuickWinBtn) {
      startQuickWinBtn.addEventListener('click', () => {
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
      startResetBtn.addEventListener('click', () => {
        const selected = Array.from(dialogQuickWins.querySelectorAll('.select-activity.active'));
        if (!selected.length) return;
        const records = selected.map(b => {
          const li = b.closest('li'); const noteEl = li ? li.querySelector('.activity-note') : null;
          return { modeId: currentMode.id, modeName: currentMode.name, modeColor: currentMode.color, action: b.dataset.activity, note: noteEl ? (noteEl.value || '').trim() : '' };
        });
        recordActivities(records);
        safeCloseDialog(modeDialog);
        clearDialogSelections(modeDialog);
      });
    }

    // keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { safeCloseDialog(modeDialog); safeCloseDialog(quickWinsDialog); safeCloseDialog(historyDialog); clearDialogSelections(); }
    });

    // resize -> re-render ring (to adjust label positions)
    window.addEventListener('resize', () => { renderCompassRing(); });
  }

  // open mode dialog
  let currentMode = null;
  function openModeDialog(modeId) {
    const m = modes.find(x => Number(x.id) === Number(modeId));
    if (!m) return;
    currentMode = m;
    if (startResetBtn) startResetBtn.disabled = true;
    const titleEl = document.getElementById('modeDialogTitle');
    const descEl = document.getElementById('dialogModeDescription');
    if (titleEl) titleEl.textContent = m.name;
    if (descEl) descEl.textContent = (m.description || '').replace(/\u2014/g, ':');
    if (dialogQuickWins) {
      const list = quickWinsMap[m.id] || [];
      dialogQuickWins.innerHTML = list.map(w => `
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

  // clear dialog selections
  function clearDialogSelections(d) {
    if (dialogQuickWins) { dialogQuickWins.querySelectorAll('.select-activity').forEach(b => b.classList.remove('active')); dialogQuickWins.querySelectorAll('.activity-note').forEach(t=>{t.classList.remove('visible'); t.value='';}); }
    if (globalQuickWinsList) { globalQuickWinsList.querySelectorAll('.select-global-activity').forEach(b => b.classList.remove('active')); globalQuickWinsList.querySelectorAll('.activity-note').forEach(t=>{t.classList.remove('visible'); t.value='';}); }
    if (startResetBtn) startResetBtn.disabled = true;
    if (startQuickWinBtn) startQuickWinBtn.disabled = true;
    if (d === modeDialog) currentMode = null;
  }

  // open history dialog
  function openHistoryDialog() {
    if (!historyDialog) return;
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const statsEl = document.getElementById('historyStats');
    const timelineEl = document.getElementById('historyTimeline');
    const total = history.length;
    const longest = Number(localStorage.getItem(LONGEST_KEY) || 0);
    if (statsEl) {
      statsEl.innerHTML = `<div class="stat-card"><span class="stat-value">${total}</span><span class="stat-label">Total Resets</span></div><div class="stat-card"><span class="stat-value">${longest}</span><span class="stat-label">Longest daily streak</span></div>`;
    }
    if (timelineEl) {
      timelineEl.innerHTML = history.length ? history.slice().reverse().map(entry => {
        const d = new Date(entry.timestamp);
        return `<div class="history-entry" style="border-left-color:${entry.modeColor || '#00AFA0'}"><div><div class="history-entry-mode">${escapeHtml(entry.modeName||'Quick Win')}</div><div class="history-entry-time">${d.toLocaleString()}</div><div class="history-entry-action">${escapeHtml(entry.action)}</div>${entry.note?`<div class="history-entry-note">${escapeHtml(entry.note)}</div>`:''}</div></div>`;
      }).join('') : '<div class="empty-history">No reset history yet. Start your first reset!</div>';
    }
    safeShowDialog(historyDialog);
  }

  // smooth arrow lerp loop using ARROW_MULTIPLIER
  let targetAngle = 0, currentAngle = 0, arrowAnimating = false;
  function startArrowLoop() {
    function onScroll(){
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max>0 ? (window.scrollY/max) : 0;
      targetAngle = pct * ARROW_MULTIPLIER;
      if (!arrowAnimating) { arrowAnimating = true; requestAnimationFrame(animate); }
    }
    window.addEventListener('scroll', () => requestAnimationFrame(onScroll), {passive:true});
    function animate(){
      currentAngle += (targetAngle - currentAngle) * 0.12;
      if (compassArrow) compassArrow.style.transform = `translate(-50%,-50%) rotate(${currentAngle}deg)`;
      if (Math.abs(targetAngle-currentAngle) > 0.01) requestAnimationFrame(animate); else arrowAnimating = false;
    }
    onScroll();
  }

  // theme
  function applySavedTheme(){
    const s = localStorage.getItem(THEME_KEY);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(s || (prefersLight?'light':'dark'));
  }
  function setTheme(name){
    if (name === 'light') document.documentElement.classList.add('light'); else document.documentElement.classList.remove('light');
    try { localStorage.setItem(THEME_KEY, name); } catch(e){}
    if (themeToggle) themeToggle.setAttribute('aria-pressed', name === 'light');
    if (themeIcon) themeIcon.textContent = name === 'light' ? '☀️' : '🌙';
  }

  function markIntroSeen(){ try{ if (!localStorage.getItem(INTRO_SEEN_KEY)) localStorage.setItem(INTRO_SEEN_KEY, '1'); }catch(e){} }

  // start
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // expose helpers for debugging
  window.__rc = { renderModes, renderCompassRing, buildWedges, openModeDialog };

})();