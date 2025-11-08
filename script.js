// script.js
// Fixes and hardening:
// - unified, robust event wiring via delegation (no node-replacement that broke handlers)
// - conic gradient wedge stops and thin separators are computed in JS so ring labels align exactly
// - dialog styling forced dark; quick-wins and mode selects reliably show notes and enable Complete
// - Complete Selected records entries and opens History immediately
// - fallback behaviors kept minimal and safe for browsers with limited <dialog> support

(function(){
  'use strict';

  // Local storage keys
  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const STREAK_KEY = 'resetCompassStreak';
  const LAST_DAY_KEY = 'resetCompassLastDay';
  const LONGEST_KEY = 'resetCompassLongest';
  const LAST_MODE_DAY_KEY = 'resetCompassLastModeDay';

  // Canonical modes
  const MODES = [
    { id: 4, name: 'Growing', color: '#2f80ed', description: 'Playful prompts to try something new or expand your horizon.' },
    { id: 3, name: 'Grounded', color: '#00c06b', description: 'Reset and connect — slow the breath and root into the present.' },
    { id: 2, name: 'Drifting', color: '#ffbf3b', description: 'Slow down and regain clarity with small clearing practices.' },
    { id: 1, name: 'Surviving', color: '#ff5f6d', description: 'Quick resets for focus and energy when things feel intense.' }
  ];

  const QUICK_WINS = {
    4: [
      { text: 'Try one small new challenge', hint: 'Pick something tiny and try it now.' },
      { text: 'Write a short reflection on progress', hint: 'Jot one sentence about something you did well.' },
      { text: 'Do a 5-minute creative exercise', hint: 'Draw or write for five minutes.' },
      { text: 'Send an encouraging message to someone', hint: 'Say something kind to a friend.' }
    ],
    3: [
      { text: 'Plant your feet and do a short stretch', hint: 'Stand tall, reach arms up, then slowly lower them.' },
      { text: 'Ground with deliberate breath: 4 4 4', hint: 'Breathe in 4, hold 4, breathe out 4. Repeat.' },
      { text: 'Put away one distracting item', hint: 'Pick one thing and put it out of sight.' },
      { text: 'Drink a glass of water', hint: 'Take a few big sips to feel refreshed.' }
    ],
    2: [
      { text: 'Take 3 deep breaths', hint: 'Slowly breathe in, then slowly out, three times.' },
      { text: 'Name 3 things you notice around you', hint: 'Say them out loud: color, sound, or object.' },
      { text: 'Lie down and relax for 2 minutes', hint: 'Close eyes, breathe gently, relax.' },
      { text: 'Slow-release breathing for 1 minute', hint: 'Breathe out longer than in to calm down.' }
    ],
    1: [
      { text: 'Take 3 quick breaths', hint: 'Quick deep breaths to regain focus.' },
      { text: 'Drink water', hint: 'Hydrate with a few sips.' },
      { text: 'Set one tiny goal for the next hour', hint: 'Make a small, easy plan to do next.' },
      { text: 'Stand up and move for 60 seconds', hint: 'Stretch or walk around for one minute.' }
    ]
  };

  // DOM refs (queried once after DOMContentLoaded)
  let compassWedges, compassRing, compassContainer, modesGrid, dialogQuickWins, startResetBtn, quickWinsDialog, globalQuickWinsList, startQuickWinBtn, historyDialog, historyDonut, historyStats, historyTimeline, clearHistoryBtn, modeDialog, modeDialogHeader, modeAccent;

  function $(selector){ return document.querySelector(selector); }
  function $all(selector){ return Array.from(document.querySelectorAll(selector)); }

  function init() {
    compassWedges = $('#compassWedges');
    compassRing = $('#compassRing');
    compassContainer = $('#compassContainer');
    modesGrid = $('#modesGrid');
    dialogQuickWins = $('#dialogQuickWins');
    startResetBtn = $('#startResetBtn');
    quickWinsDialog = $('#quickWinsDialog');
    globalQuickWinsList = $('#globalQuickWins');
    startQuickWinBtn = $('#startQuickWinBtn');
    historyDialog = $('#historyDialog');
    historyDonut = $('#historyDonut');
    historyStats = $('#historyStats');
    historyTimeline = $('#historyTimeline');
    clearHistoryBtn = $('#clearHistoryBtn');
    modeDialog = $('#modeDialog');
    modeDialogHeader = $('#modeDialogHeader');
    modeAccent = $('#modeAccent');

    applySavedTheme();
    renderModeList();
    buildWedgesAndSeparators();
    placeRingLabels();
    renderGlobalQuickWins();
    initHistory();
    updateStreakDisplay();
    wireGlobalHandlers();

    // Keep compass labels correctly placed on resize
    window.addEventListener('resize', () => {
      buildWedgesAndSeparators();
      placeRingLabels();
    });
  }

  /* ---------------------------
     Rendering helpers
     --------------------------- */

  function renderModeList(){
    if (!modesGrid) return;
    modesGrid.innerHTML = MODES.map(m => `
      <button class="mode-card" data-mode-id="${m.id}" style="--mode-color:${m.color}">
        <div class="mode-meta">
          <div class="mode-name">${escapeHtml(m.name)}</div>
          <div class="mode-desc">${escapeHtml(m.description)}</div>
          <div class="mode-hint">Tap to open activities</div>
        </div>
      </button>
    `).join('');
  }

  // Build conic gradient with a small gap slice used as separator. JS computes exact stops so ring labels align.
  function buildWedgesAndSeparators(){
    if (!compassWedges) return;
    const N = MODES.length;
    const portion = 360 / N;
    const gap = 0.9; // degrees used for separator slice
    const stops = [];
    for (let i=0;i<N;i++){
      const start = Math.round(i * portion * 100) / 100;
      const end = Math.round(((i + 1) * portion) * 100) / 100;
      const color = MODES[i].color;
      const wedgeEnd = end - gap;
      stops.push(`${color} ${start}deg ${wedgeEnd}deg`);
      // separator slice
      stops.push(`rgba(0,0,0,0.36) ${wedgeEnd}deg ${end}deg`);
    }
    compassWedges.style.background = `conic-gradient(from -45deg, ${stops.join(',')})`;
    compassWedges.style.filter = 'saturate(1.08) contrast(1.03)';
  }

  function placeRingLabels(){
    if (!compassRing || !compassContainer) return;
    compassRing.innerHTML = '';
    const rect = compassContainer.getBoundingClientRect();
    const cx = rect.width/2, cy = rect.height/2, radius = Math.min(cx, cy);
    const portion = 360 / MODES.length;
    MODES.forEach((m, idx) => {
      const centerAngle = ((idx + 0.5) * portion) - 45;
      const rad = (centerAngle - 90) * (Math.PI / 180);
      const rFactor = 0.58;
      const rPx = Math.min(Math.max(radius * rFactor, radius * 0.28), radius * 0.75);
      const left = cx + Math.cos(rad) * rPx;
      const top = cy + Math.sin(rad) * rPx;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ring-btn';
      btn.dataset.modeId = m.id;
      btn.innerHTML = `<span class="ring-label">${escapeHtml(m.name)}</span>`;
      btn.style.left = `${left}px`;
      btn.style.top = `${top}px`;
      btn.style.background = `linear-gradient(180deg, ${m.color}DD, rgba(0,0,0,0.08))`;
      btn.style.boxShadow = `0 28px 110px rgba(0,0,0,0.66), 0 0 48px ${hexToRgba(m.color,0.18)}`;
      compassRing.appendChild(btn);
    });
  }

  function renderGlobalQuickWins(){
    if (!globalQuickWinsList) return;
    const all = [];
    Object.values(QUICK_WINS).forEach(arr => arr.forEach(a => { if (!all.find(x=>x.text===a.text)) all.push(a); }));
    globalQuickWinsList.innerHTML = all.map(a => `
      <li>
        <div class="activity-row">
          <div style="max-width:70%">${escapeHtml(a.text)}<div class="activity-instruction">${escapeHtml(a.hint)}</div></div>
          <div><button class="select-global-activity" data-activity="${escapeHtml(a.text)}">Select</button></div>
        </div>
        <textarea class="activity-note" data-activity="${escapeHtml(a.text)}" placeholder="Notes (optional)" hidden></textarea>
      </li>
    `).join('');
    if (startQuickWinBtn) startQuickWinBtn.disabled = true;
  }

  /* ---------------------------
     History / storage helpers
     --------------------------- */

  function initHistory(){
    try { JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e) { localStorage.setItem(HISTORY_KEY, '[]'); }
  }

  function todayKey(){
    return new Date().toISOString().split('T')[0];
  }

  function incrementStreakIfNeeded(){
    try{
      const last = localStorage.getItem(LAST_DAY_KEY);
      const today = todayKey();
      let streak = Number(localStorage.getItem(STREAK_KEY) || 0);
      let longest = Number(localStorage.getItem(LONGEST_KEY) || 0);
      if (last === today) return false;
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yKey = y.toISOString().split('T')[0];
      streak = (last === yKey) ? streak + 1 : 1;
      if (streak > longest) localStorage.setItem(LONGEST_KEY, String(streak));
      localStorage.setItem(STREAK_KEY, String(streak));
      localStorage.setItem(LAST_DAY_KEY, today);
      updateStreakDisplay();
      return true;
    }catch(e){ return false; }
  }

  function updateStreakDisplay(){
    const s = Number(localStorage.getItem(STREAK_KEY) || 0);
    const el = document.getElementById('streakBadge');
    if (el) el.textContent = `Daily streak: 🔥 ${s}`;
  }

  function recordActivities(entries){
    if (!entries || !entries.length) return;
    const today = todayKey();
    const modeEntries = entries.filter(e=>e.modeId);
    const lastModeDay = localStorage.getItem(LAST_MODE_DAY_KEY);
    if (modeEntries.length > 0 && lastModeDay === today){
      showComeBackDialog();
      return;
    }

    let hist = [];
    try { hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e) { hist = []; }
    entries.forEach(r => hist.push({
      timestamp: new Date().toISOString(),
      modeId: r.modeId || null,
      modeName: r.modeName || (r.modeId ? (MODES.find(m=>m.id===r.modeId)||{}).name : 'Quick Win'),
      modeColor: r.modeColor || (r.modeId ? (MODES.find(m=>m.id===r.modeId)||{}).color : '#00AFA0'),
      action: r.action || 'Activity',
      note: r.note || ''
    }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));

    const bumped = incrementStreakIfNeeded();
    if (modeEntries.length > 0) localStorage.setItem(LAST_MODE_DAY_KEY, today);

    showToast(`${entries.length} activity${entries.length>1?'ies':'y'} recorded`);
    // Open history after brief delay so user sees the toast and potential pulse
    setTimeout(()=> openHistoryDialog(), 420);
    if (modeEntries.length > 0) setTimeout(()=> showComeBackDialog(), 900);
  }

  function openHistoryDialog(){
    if (!historyDialog) return;
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const counts = {};
    MODES.forEach(m => counts[m.name] = 0);
    history.forEach(h => { const name = h.modeName || 'Quick Win'; counts[name] = (counts[name] || 0) + 1; });

    if (historyStats) {
      historyStats.innerHTML = '';
      const total = history.length;
      const longest = Number(localStorage.getItem(LONGEST_KEY) || 0);
      historyStats.insertAdjacentHTML('beforeend', `<div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total resets</div></div>`);
      historyStats.insertAdjacentHTML('beforeend', `<div class="stat-card"><div class="stat-value">${longest}</div><div class="stat-label">Longest streak</div></div>`);
      MODES.forEach(m => {
        const c = counts[m.name] || 0;
        const pct = total ? Math.round((c/total)*100) : 0;
        historyStats.insertAdjacentHTML('beforeend', `<div class="stat-card" style="border-left:8px solid ${m.color};"><div class="stat-value">${c}</div><div class="stat-label">${escapeHtml(m.name)} • ${pct}%</div></div>`);
      });
    }

    const donutData = MODES.map(m => ({ value: counts[m.name] || 0, color: m.color }));
    drawDonut(donutData);

    if (historyTimeline){
      historyTimeline.innerHTML = history.length ? history.slice().reverse().map(e=>{
        const d = new Date(e.timestamp);
        return `<div class="history-entry" style="border-left-color:${e.modeColor||'#00AFA0'}"><div><strong>${escapeHtml(e.modeName||'Quick Win')}</strong> • ${d.toLocaleString()}<div style="margin-top:6px;color:var(--text-secondary)">${escapeHtml(e.action)}</div>${e.note?`<div style="margin-top:8px;color:var(--text-secondary)">${escapeHtml(e.note)}</div>`:''}</div></div>`;
      }).join('') : '<div class="empty-history">No reset history yet. Start your first reset!</div>';
    }

    safeShowDialog(historyDialog);
  }

  function drawDonut(counts){
    if (!historyDonut) return;
    const ctx = historyDonut.getContext('2d');
    const W = historyDonut.width, H = historyDonut.height;
    ctx.clearRect(0,0,W,H);
    const total = counts.reduce((s,c)=>s+c.value,0);
    const cx = W/2, cy = H/2, r = Math.min(W,H)/2 - 8;
    let start = -Math.PI/2;
    counts.forEach(c=>{
      const slice = total ? (c.value/total)*Math.PI*2 : 0;
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,start+slice); ctx.closePath();
      ctx.fillStyle = c.color; ctx.fill();
      start += slice;
    });
    ctx.beginPath(); ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-elevated') || '#111'; ctx.arc(cx,cy,r*0.56,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary') || '#fff'; ctx.font='700 18px system-ui,Arial'; ctx.textAlign='center';
    ctx.fillText(total, cx, cy+6);
  }

  /* ---------------------------
     UI wiring (delegation + stable listeners)
     --------------------------- */

  function wireGlobalHandlers(){
    // navigation toggles (nav dropdown)
    const navToggle = document.getElementById('navMenuToggle');
    const navMenu = document.getElementById('navDropdown');
    if (navToggle && navMenu){
      navToggle.addEventListener('click', (ev)=>{ ev.stopPropagation(); const open = navMenu.getAttribute('aria-hidden') === 'false'; navMenu.setAttribute('aria-hidden', open ? 'true' : 'false'); navToggle.setAttribute('aria-expanded', !open); });
      document.addEventListener('click', (ev)=>{ if (navMenu.getAttribute('aria-hidden') === 'false' && !navMenu.contains(ev.target) && ev.target !== navToggle) { navMenu.setAttribute('aria-hidden','true'); navToggle.setAttribute('aria-expanded','false'); }});
    }

    // document-level click handling (delegated)
    document.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      // data-action nav
      const actionEl = e.target.closest('[data-action]');
      if (actionEl){
        const action = actionEl.dataset.action;
        if (action === 'quick-wins'){ safeShowDialog(quickWinsDialog); return; }
        if (action === 'history'){ openHistoryDialog(); return; }
        if (action === 'about'){ window.location.href = './about.html'; return; }
        if (action === 'home'){ window.location.href = './index.html'; return; }
        if (action === 'toggle-theme'){ toggleTheme(); return; }
      }

      // ring label click
      const ringBtn = e.target.closest('.ring-btn[data-mode-id]');
      if (ringBtn){ openModeDialog(Number(ringBtn.dataset.modeId)); return; }

      // mode-card click
      const modeCard = e.target.closest('.mode-card[data-mode-id]');
      if (modeCard){ openModeDialog(Number(modeCard.dataset.modeId)); return; }

      // select global quick-win
      const gsel = e.target.closest('.select-global-activity');
      if (gsel){
        e.preventDefault();
        gsel.classList.toggle('active');
        const ta = gsel.closest('li').querySelector('.activity-note');
        if (ta) ta.hidden = !gsel.classList.contains('active');
        const any = globalQuickWinsList.querySelectorAll('.select-global-activity.active').length > 0;
        if (startQuickWinBtn) startQuickWinBtn.disabled = !any;
        return;
      }

      // select activity in mode dialog
      const msel = e.target.closest('.select-activity');
      if (msel){
        e.preventDefault();
        // if label says Locked, show come back
        if (msel.textContent.trim().toLowerCase() === 'locked'){ showComeBackDialog(); return; }
        msel.classList.toggle('active');
        const ta = msel.closest('li').querySelector('.activity-note');
        if (ta) ta.hidden = !msel.classList.contains('active');
        if (startResetBtn) startResetBtn.disabled = !(dialogQuickWins.querySelectorAll('.select-activity.active').length > 0);
        return;
      }

      // dialog close / cancel
      if (e.target.closest('.dialog-close') || e.target.closest('.dialog-cancel')){
        const d = e.target.closest('dialog');
        if (d){ safeCloseDialog(d); clearDialogSelections(); }
      }
    }, true);

    // startQuickWinBtn handler (stable listener)
    if (startQuickWinBtn){
      startQuickWinBtn.addEventListener('click', function(){
        const selected = Array.from(globalQuickWinsList.querySelectorAll('.select-global-activity.active'));
        if (!selected.length) return;
        const records = selected.map(b=>{
          const ta = b.closest('li').querySelector('.activity-note');
          return { modeId: null, action: b.dataset.activity, note: ta ? (ta.value||'').trim() : '' };
        });
        recordActivities(records);
        safeCloseDialog(quickWinsDialog);
        clearDialogSelections();
      });
    }

    // clear history
    if (clearHistoryBtn){
      clearHistoryBtn.addEventListener('click', function(){
        localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
        localStorage.removeItem(STREAK_KEY);
        localStorage.removeItem(LONGEST_KEY);
        localStorage.removeItem(LAST_DAY_KEY);
        localStorage.removeItem(LAST_MODE_DAY_KEY);
        if (historyDonut) historyDonut.getContext('2d').clearRect(0,0,historyDonut.width,historyDonut.height);
        if (historyStats) historyStats.innerHTML = '';
        if (historyTimeline) historyTimeline.innerHTML = '<div class="empty-history">History cleared.</div>';
        showToast('History cleared');
      });
    }
  }

  /* ---------------------------
     Mode dialog flow
     --------------------------- */

  function openModeDialog(modeId){
    const m = MODES.find(x => x.id === Number(modeId));
    if (!m) return;

    // fill header accent & text
    if (modeAccent) modeAccent.style.background = m.color;
    const titleEl = $('#modeDialogTitle');
    const descEl = $('#dialogModeDescription');
    if (titleEl) titleEl.textContent = m.name;
    if (descEl) descEl.textContent = m.description;

    // populate activities into dialogQuickWins
    const locked = (localStorage.getItem(LAST_MODE_DAY_KEY) === todayKey());
    const arr = QUICK_WINS[m.id] || [];
    if (!dialogQuickWins) return;
    dialogQuickWins.innerHTML = arr.map(a => `
      <li>
        <div class="activity-row">
          <div style="max-width:70%">${escapeHtml(a.text)}<div class="activity-instruction">${escapeHtml(a.hint)}</div></div>
          <div><button class="select-activity" data-activity="${escapeHtml(a.text)}">${locked ? 'Locked' : 'Select'}</button></div>
        </div>
        <textarea class="activity-note" data-activity="${escapeHtml(a.text)}" placeholder="Notes (optional)" hidden></textarea>
      </li>
    `).join('');

    // ensure startResetBtn state
    if (startResetBtn) startResetBtn.disabled = true;

    safeShowDialog($('#modeDialog'));
  }

  /* ---------------------------
     Dialog helpers and misc
     --------------------------- */

  function safeShowDialog(d){
    if (!d) return;
    if (typeof d.showModal === 'function'){
      try{ d.showModal(); const f = d.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (f) f.focus(); } catch(e){ console.warn(e); }
    } else {
      // fallback for browsers without <dialog> support: emulate by toggling a class
      d.style.display = 'block';
      d.setAttribute('open', '');
    }
  }

  function safeCloseDialog(d){
    if (!d) return;
    try{
      if (typeof d.close === 'function' && d.open) d.close();
      else { d.style.display = 'none'; d.removeAttribute('open'); }
    } catch(e){ console.warn(e); }
  }

  function clearDialogSelections(){
    $all('.select-activity').forEach(b => b.classList.remove('active'));
    $all('.activity-note').forEach(t => { t.hidden = true; t.value = ''; });
    $all('.select-global-activity').forEach(b => b.classList.remove('active'));
    if (startResetBtn) startResetBtn.disabled = true;
    if (startQuickWinBtn) startQuickWinBtn.disabled = true;
  }

  function showComeBackDialog(){
    const d = $('#comeBackDialog');
    safeShowDialog(d);
  }

  /* ---------------------------
     Utilities
     --------------------------- */

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function hexToRgba(hex, alpha=1){
    const h = hex.replace('#','');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function showToast(text, ms = 1400){
    const el = document.createElement('div');
    el.className = 'rc-toast';
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(()=>el.classList.add('visible'));
    setTimeout(()=>{ el.classList.remove('visible'); setTimeout(()=>el.remove(),220); }, ms);
  }

  function toggleTheme(){
    const isLight = document.documentElement.classList.toggle('light');
    try{ localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark'); } catch(e){}
  }

  /* ---------------------------
     Arrow animation (subtle)
     --------------------------- */

  let targetAngle = 0, currentAngle = 0, animating = false;
  function startArrowLoop(){
    function onScroll(){
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) : 0;
      targetAngle = pct * ARROW_MULTIPLIER;
      if (!animating){ animating = true; requestAnimationFrame(animate); }
    }
    function animate(){
      currentAngle += (targetAngle - currentAngle) * 0.12;
      const el = $('#compassArrow');
      if (el) el.style.transform = `translate(-50%,-50%) rotate(${currentAngle}deg)`;
      if (Math.abs(targetAngle - currentAngle) > 0.01) requestAnimationFrame(animate);
      else animating = false;
    }
    window.addEventListener('scroll', ()=>requestAnimationFrame(onScroll), { passive: true });
    onScroll();
  }

  // DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // expose for debug
  window.__rc = { buildWedgesAndSeparators, placeRingLabels, openModeDialog, recordActivities };

})();