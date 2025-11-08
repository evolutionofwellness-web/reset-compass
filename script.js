// script.js
// Restored and simplified event wiring and fixed wedge alignment + separators.
// Key behaviors:
// - Event delegation for selects and complete buttons so nothing breaks if elements are re-rendered.
// - buildWedges produces a conic-gradient that aligns with separators (CSS overlay adds subtle separator).
// - Selecting an activity reveals notes textarea and enables the appropriate Complete button.
// - Completing Quick Wins or Mode activities records entries, opens History, pulses feedback and (for mode) shows come-back.

(function(){
  'use strict';

  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const STREAK_KEY = 'resetCompassStreak';
  const LAST_DAY_KEY = 'resetCompassLastDay';
  const LONGEST_KEY = 'resetCompassLongest';
  const LAST_MODE_DAY_KEY = 'resetCompassLastModeDay';

  const compassWedges = document.getElementById('compassWedges');
  const compassRing = document.getElementById('compassRing');
  const compassContainer = document.getElementById('compassContainer');

  const modesGrid = document.getElementById('modesGrid');
  const dialogQuickWins = document.getElementById('dialogQuickWins');
  const startResetBtn = document.getElementById('startResetBtn');
  const quickWinsDialog = document.getElementById('quickWinsDialog');
  const globalQuickWinsList = document.getElementById('globalQuickWins');
  const startQuickWinBtn = document.getElementById('startQuickWinBtn');
  const historyDialog = document.getElementById('historyDialog');
  const historyDonut = document.getElementById('historyDonut');
  const historyStats = document.getElementById('historyStats');
  const historyTimeline = document.getElementById('historyTimeline');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const comeBackDialog = document.getElementById('comeBackDialog');

  const navMenuToggle = document.getElementById('navMenuToggle');
  const navDropdown = document.getElementById('navDropdown');

  const ARROW_MULTIPLIER = 5760;

  const canonical = {
    4: { id:4, name:'Growing',   description:'Playful prompts to try something new or expand your horizon.', color:'#2f80ed' },
    3: { id:3, name:'Grounded',  description:'Reset and connect — slow the breath and root into the present.', color:'#00c06b' },
    2: { id:2, name:'Drifting',  description:'Slow down and regain clarity with small clearing practices.', color:'#ffbf3b' },
    1: { id:1, name:'Surviving', description:'Quick resets for focus and energy when things feel intense.', color:'#ff5f6d' }
  };

  const quickWinsMap = {
    4: [
      { text:'Try one small new challenge', hint:'Pick something tiny and try it now.' },
      { text:'Write a short reflection on progress', hint:'Jot one sentence about something you did well.' },
      { text:'Do a 5-minute creative exercise', hint:'Draw or write for five minutes.' },
      { text:'Send an encouraging message to someone', hint:'Say something kind to a friend.' }
    ],
    3: [
      { text:'Plant your feet and do a short stretch', hint:'Stand tall, reach arms up, then slowly lower them.' },
      { text:'Ground with deliberate breath: 4 4 4', hint:'Breathe in 4, hold 4, breathe out 4. Repeat.' },
      { text:'Put away one distracting item', hint:'Pick one thing and put it out of sight.' },
      { text:'Drink a glass of water', hint:'Take a few big sips to feel refreshed.' }
    ],
    2: [
      { text:'Take 3 deep breaths', hint:'Slowly breathe in, then slowly out, three times.' },
      { text:'Name 3 things you notice around you', hint:'Say them out loud: color, sound, or object.' },
      { text:'Lie down and relax for 2 minutes', hint:'Close eyes, breathe gently, relax.' },
      { text:'Slow-release breathing for 1 minute', hint:'Breathe out longer than in to calm down.' }
    ],
    1: [
      { text:'Take 3 quick breaths', hint:'Quick deep breaths to regain focus.' },
      { text:'Drink water', hint:'Hydrate with a few sips.' },
      { text:'Set one tiny goal for the next hour', hint:'Make a small, easy plan to do next.' },
      { text:'Stand up and move for 60 seconds', hint:'Stretch or walk around for one minute.' }
    ]
  };

  let modes = [];

  function init(){
    loadModes();
    renderModes();
    buildWedges();
    placeRingLabels();
    renderGlobalQuickWins();
    initHistory();
    attachListeners();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) startArrowLoop();
  }

  function loadModes(){ modes = [canonical[4], canonical[3], canonical[2], canonical[1]]; }

  function renderModes(){
    if (!modesGrid) return;
    modesGrid.innerHTML = modes.map(m=>`
      <button class="mode-card" data-mode-id="${m.id}" style="--mode-color:${m.color}">
        <div class="mode-meta">
          <div class="mode-name">${escapeHtml(m.name)}</div>
          <div class="mode-desc">${escapeHtml(m.description)}</div>
          <div class="mode-hint">Tap to open activities</div>
        </div>
      </button>`).join('');
  }

  // Build wedge conic gradient with thin separators (JS computes exact stops)
  function buildWedges(){
    if (!compassWedges || !modes.length) return;
    const gap = 0.8; // degrees for separator
    const portion = 360 / modes.length;
    const parts = [];
    for (let i=0;i<modes.length;i++){
      const start = i*portion;
      const end = (i+1)*portion;
      const color = modes[i].color;
      const midStart = start;
      const midEnd = end - gap;
      // wedge color portion
      parts.push(`${color} ${midStart}deg ${midEnd}deg`);
      // separator thin slice
      const sepColor = 'rgba(0,0,0,0.36)';
      parts.push(`${sepColor} ${midEnd}deg ${end}deg`);
    }
    compassWedges.style.background = `conic-gradient(from -45deg, ${parts.join(',')})`;
    compassWedges.style.filter = 'saturate(1.1) contrast(1.05)';
  }

  // Place ring labels in polar coordinates; compute same angles as buildWedges
  function placeRingLabels(){
    if (!compassRing || !compassContainer) return;
    compassRing.innerHTML = '';
    const rect = compassContainer.getBoundingClientRect();
    const cx = rect.width/2, cy = rect.height/2, radius = Math.min(cx,cy);
    const portion = 360 / modes.length;
    modes.forEach((m,idx)=>{
      const centerAngle = ((idx + 0.5) * portion) - 45;
      const rad = (centerAngle - 90) * (Math.PI/180);
      const rFactor = 0.58;
      const rPx = Math.min(Math.max(radius*rFactor, radius*0.28), radius*0.75);
      const left = cx + Math.cos(rad) * rPx;
      const top = cy + Math.sin(rad) * rPx;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ring-btn';
      btn.dataset.modeId = m.id;
      btn.innerHTML = `<span class="ring-label">${escapeHtml(m.name)}</span>`;
      btn.style.left = `${left}px`;
      btn.style.top = `${top}px`;
      btn.style.background = `linear-gradient(180deg, ${m.color}DD, rgba(0,0,0,0.1))`;
      btn.style.boxShadow = `0 28px 100px rgba(0,0,0,0.66), 0 0 42px ${hexToRgba(m.color,0.18)}`;
      compassRing.appendChild(btn);
    });
  }

  function renderGlobalQuickWins(){
    if (!globalQuickWinsList) return;
    const all = [];
    Object.values(quickWinsMap).forEach(arr => arr.forEach(a => { if (!all.find(x=>x.text===a.text)) all.push(a); }));
    globalQuickWinsList.innerHTML = all.map(a=>`
      <li>
        <div class="activity-row">
          <div style="max-width:70%">${escapeHtml(a.text)}<div class="activity-instruction">${escapeHtml(a.hint)}</div></div>
          <div><button class="select-global-activity" data-activity="${escapeHtml(a.text)}">Select</button></div>
        </div>
        <textarea class="activity-note" data-activity="${escapeHtml(a.text)}" placeholder="Notes (optional)" hidden></textarea>
      </li>`).join('');

    // Initialize startQuickWinBtn state
    const sq = document.getElementById('startQuickWinBtn');
    if (sq) sq.disabled = true;
  }

  function initHistory(){ try{ JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]'); }catch(e){ localStorage.setItem(HISTORY_KEY,'[]'); } }

  function todayKey(){ return new Date().toISOString().split('T')[0]; }

  function incrementStreakIfNeeded(){
    try{
      const last = localStorage.getItem(LAST_DAY_KEY);
      const today = todayKey();
      let streak = Number(localStorage.getItem(STREAK_KEY) || 0);
      let longest = Number(localStorage.getItem(LONGEST_KEY) || 0);
      if (last === today) return false;
      const y = new Date(); y.setDate(y.getDate()-1);
      const yKey = y.toISOString().split('T')[0];
      streak = (last === yKey) ? streak + 1 : 1;
      if (streak > longest) localStorage.setItem(LONGEST_KEY, String(streak));
      localStorage.setItem(STREAK_KEY, String(streak));
      localStorage.setItem(LAST_DAY_KEY, today);
      document.getElementById('streakBadge').textContent = `Daily streak: 🔥 ${streak}`;
      return true;
    }catch(e){ return false; }
  }

  function recordActivities(entries){
    if (!entries || !entries.length) return;
    const today = todayKey();
    const modeEntries = entries.filter(e=>e.modeId);
    const lastModeDay = localStorage.getItem(LAST_MODE_DAY_KEY);
    if (modeEntries.length > 0 && lastModeDay === today) { showComeBackDialog(); return; }

    let hist = [];
    try{ hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }catch(e){ hist = []; }
    entries.forEach(r => hist.push({
      timestamp: new Date().toISOString(),
      modeId: r.modeId || null,
      modeName: r.modeName || (r.modeId ? (modes.find(m=>m.id===r.modeId)||{}).name : 'Quick Win'),
      modeColor: r.modeColor || (r.modeId ? (modes.find(m=>m.id===r.modeId)||{}).color : '#00AFA0'),
      action: r.action || 'Activity',
      note: r.note || ''
    }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));

    const bumped = incrementStreakIfNeeded();
    if (modeEntries.length > 0) localStorage.setItem(LAST_MODE_DAY_KEY, today);

    showToast(`${entries.length} activity${entries.length>1?'ies':'y'} recorded`);
    setTimeout(()=> openHistoryDialog(), 420);
    if (modeEntries.length > 0) setTimeout(()=> showComeBackDialog(), 900);
  }

  function drawHistoryDonut(counts){
    if (!historyDonut) return;
    const ctx = historyDonut.getContext('2d');
    const W = historyDonut.width, H = historyDonut.height;
    ctx.clearRect(0,0,W,H);
    const total = counts.reduce((s,c)=>s+c.value,0);
    const cx = W/2, cy = H/2, r = Math.min(W,H)/2 - 8;
    let start = -Math.PI/2;
    counts.forEach(c=>{
      const slice = total ? (c.value/total) * Math.PI * 2 : 0;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,start,start+slice);
      ctx.closePath();
      ctx.fillStyle = c.color; ctx.fill();
      start += slice;
    });
    ctx.beginPath(); ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-elevated') || '#111'; ctx.arc(cx,cy,r*0.56,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary') || '#fff';
    ctx.font = '700 18px system-ui,Arial'; ctx.textAlign = 'center'; ctx.fillText(total, cx, cy+6);
  }

  function openHistoryDialog(){
    if (!historyDialog) return;
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const counts = {};
    modes.forEach(m => counts[m.name] = 0);
    history.forEach(h=> counts[h.modeName || 'Quick Win'] = (counts[h.modeName || 'Quick Win']||0) + 1);

    if (historyStats) {
      historyStats.innerHTML = '';
      historyStats.insertAdjacentHTML('beforeend', `<div class="stat-card"><div class="stat-value">${history.length}</div><div class="stat-label">Total resets</div></div>`);
      historyStats.insertAdjacentHTML('beforeend', `<div class="stat-card"><div class="stat-value">${Number(localStorage.getItem(LONGEST_KEY) || 0)}</div><div class="stat-label">Longest streak</div></div>`);
      modes.forEach(m=>{
        const c = counts[m.name] || 0;
        const pct = history.length ? Math.round((c/history.length)*100) : 0;
        historyStats.insertAdjacentHTML('beforeend', `<div class="stat-card" style="border-left:8px solid ${m.color};"><div class="stat-value">${c}</div><div class="stat-label">${escapeHtml(m.name)} • ${pct}%</div></div>`);
      });
    }

    const donutData = modes.map(m=>({ value: counts[m.name] || 0, color: m.color }));
    drawHistoryDonut(donutData);

    if (historyTimeline) {
      historyTimeline.innerHTML = history.length ? history.slice().reverse().map(en=>{
        const d = new Date(en.timestamp);
        return `<div class="history-entry" style="border-left-color:${en.modeColor||'#00AFA0'}"><div><strong>${escapeHtml(en.modeName||'Quick Win')}</strong> • ${d.toLocaleString()}<div style="margin-top:6px;color:var(--text-secondary)">${escapeHtml(en.action)}</div>${en.note?`<div style="margin-top:8px;color:var(--text-secondary)">${escapeHtml(en.note)}</div>`:''}</div></div>`;
      }).join('') : '<div class="empty-history">No reset history yet. Start your first reset!</div>';
    }

    safeShowDialog(historyDialog);
  }

  function safeShowDialog(d){ if(!d) return; try{ d.showModal(); const f = d.querySelector('button, input, textarea, [tabindex]:not([tabindex="-1"])'); if (f) f.focus(); }catch(e){ console.warn(e); } }
  function safeCloseDialog(d){ if(!d) return; try{ if (d.open) d.close(); }catch(e){} }

  function showComeBackDialog(){ if (!comeBackDialog) { showToast('You already completed a mode today — come back tomorrow.'); return; } try{ comeBackDialog.showModal(); }catch(e){ alert('You already completed a mode today — come back tomorrow.'); } }

  function attachListeners(){
    // dropdown toggle (index page only)
    if (navMenuToggle && navDropdown) {
      navMenuToggle.addEventListener('click', (ev)=>{ ev.stopPropagation(); const open = navDropdown.getAttribute('aria-hidden') === 'false'; navDropdown.setAttribute('aria-hidden', open ? 'true' : 'false'); navMenuToggle.setAttribute('aria-expanded', !open); });
      document.addEventListener('click', (ev)=>{ if (navDropdown.getAttribute('aria-hidden') === 'false' && !navDropdown.contains(ev.target) && ev.target !== navMenuToggle) { navDropdown.setAttribute('aria-hidden','true'); navMenuToggle.setAttribute('aria-expanded','false'); }});
    }

    // global click delegation for selects and navigation
    document.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      // data-action nav
      const actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        const action = actionEl.dataset.action;
        if (action === 'quick-wins') { safeShowDialog(quickWinsDialog); return; }
        if (action === 'history') { openHistoryDialog(); return; }
        if (action === 'about') { window.location.href = './about.html'; return; }
        if (action === 'home') { window.location.href = './index.html'; return; }
        if (action === 'toggle-theme') { const name = document.documentElement.classList.contains('light') ? 'dark' : 'light'; setTheme(name); return; }
      }

      // ring label click
      const ringBtn = e.target.closest('.ring-btn[data-mode-id]');
      if (ringBtn) { openModeDialog(Number(ringBtn.dataset.modeId)); return; }

      // mode-card click
      const modeCard = e.target.closest('.mode-card[data-mode-id]');
      if (modeCard) { openModeDialog(Number(modeCard.dataset.modeId)); return; }

      // select buttons are handled by delegation below (in dialog wiring)
      if (e.target.closest('.dialog-close') || e.target.closest('.dialog-cancel')) {
        const d = e.target.closest('dialog');
        if (d) { safeCloseDialog(d); clearDialogSelections(d); }
      }
    }, true);

    // Quick Wins selects delegation
    document.addEventListener('click', function(e){
      const gsel = e.target.closest('.select-global-activity');
      if (gsel) {
        e.preventDefault();
        gsel.classList.toggle('active');
        const ta = gsel.closest('li').querySelector('.activity-note');
        if (ta) ta.hidden = !gsel.classList.contains('active');
        const any = globalQuickWinsList.querySelectorAll('.select-global-activity.active').length > 0;
        const sq = document.getElementById('startQuickWinBtn'); if (sq) sq.disabled = !any;
        return;
      }
      const msel = e.target.closest('.select-activity');
      if (msel) {
        e.preventDefault();
        // handled inside openModeDialog wiring; but fallback toggle to be safe
        msel.classList.toggle('active');
        const ta = msel.closest('li').querySelector('.activity-note');
        if (ta) ta.hidden = !msel.classList.contains('active');
        const any = dialogQuickWins.querySelectorAll('.select-activity.active').length > 0;
        const sr = document.getElementById('startResetBtn'); if (sr) sr.disabled = !any;
        return;
      }
    }, true);

    // startQuickWinBtn - ensure wired (no replace)
    const sq = document.getElementById('startQuickWinBtn');
    if (sq) {
      sq.addEventListener('click', ()=>{
        const selected = Array.from(globalQuickWinsList.querySelectorAll('.select-global-activity.active'));
        if (!selected.length) return;
        const records = selected.map(b=> {
          const ta = b.closest('li').querySelector('.activity-note');
          return { modeId:null, action: b.dataset.activity, note: ta ? (ta.value||'').trim() : '' };
        });
        recordActivities(records);
        safeCloseDialog(quickWinsDialog);
        clearDialogSelections(quickWinsDialog);
      });
    }

    // clear history
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', ()=>{
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

    // Escape closes dialogs and dropdowns
    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape') {
        if (navDropdown && navDropdown.getAttribute('aria-hidden') === 'false') { navDropdown.setAttribute('aria-hidden','true'); navMenuToggle.setAttribute('aria-expanded','false'); }
        document.querySelectorAll('dialog[open]').forEach(d=> safeCloseDialog(d));
        clearDialogSelections();
      }
    });
  }

  function openModeDialog(modeId){
    const m = modes.find(x=>x.id===Number(modeId));
    if (!m || !dialogQuickWins) return;
    currentMode = m;

    // set header
    const hdr = document.getElementById('modeDialogHeader');
    const accent = hdr.querySelector('.accent');
    const headInner = hdr.querySelector('.mode-head-inner');
    if (accent) accent.style.background = m.color;
    if (headInner) headInner.innerHTML = `<h2 class="mode-title">${escapeHtml(m.name)}</h2><p class="mode-description">${escapeHtml(m.description)}</p>`;

    // populate activities
    const lastModeDay = localStorage.getItem(LAST_MODE_DAY_KEY);
    const locked = lastModeDay === todayKey();
    const arr = quickWinsMap[m.id] || [];
    dialogQuickWins.innerHTML = arr.map(a=>`
      <li>
        <div class="activity-row">
          <div style="max-width:70%">${escapeHtml(a.text)}<div class="activity-instruction">${escapeHtml(a.hint)}</div></div>
          <div><button class="select-activity" data-activity="${escapeHtml(a.text)}">${locked ? 'Locked' : 'Select'}</button></div>
        </div>
        <textarea class="activity-note" data-activity="${escapeHtml(a.text)}" placeholder="Notes (optional)" hidden></textarea>
      </li>`).join('');

    // if locked, add explanatory note
    const existing = dialogQuickWins.nextElementSibling;
    if (existing && existing.classList && existing.classList.contains('rc-locked-note')) existing.remove();
    if (locked) {
      const note = document.createElement('div'); note.className = 'rc-locked-note';
      note.style.marginTop = '12px'; note.style.color = getComputedStyle(document.body).getPropertyValue('--text-secondary');
      note.textContent = 'You already completed a mode today — come back tomorrow to complete another mode. Quick Wins remain available.';
      dialogQuickWins.parentNode.insertBefore(note, dialogQuickWins.nextSibling);
    }

    // wire selects inside dialog (delegation earlier handles toggle, but ensure startResetBtn state)
    const sr = document.getElementById('startResetBtn');
    if (sr) sr.disabled = true;

    // open
    safeShowDialog(document.getElementById('modeDialog'));
  }

  function clearDialogSelections(d){
    if (dialogQuickWins) { dialogQuickWins.querySelectorAll('.select-activity').forEach(b=>b.classList.remove('active')); dialogQuickWins.querySelectorAll('.activity-note').forEach(t=>{ t.hidden=true; t.value=''; }); }
    if (globalQuickWinsList) { globalQuickWinsList.querySelectorAll('.select-global-activity').forEach(b=>b.classList.remove('active')); globalQuickWinsList.querySelectorAll('.activity-note').forEach(t=>{ t.hidden=true; t.value=''; }); }
    const sr = document.getElementById('startResetBtn'); if (sr) sr.disabled = true;
    const sq = document.getElementById('startQuickWinBtn'); if (sq) sq.disabled = true;
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function hexToRgba(hex,alpha=1){ const h=hex.replace('#',''); const bigint=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16); const r=(bigint>>16)&255; const g=(bigint>>8)&255; const b=bigint&255; return `rgba(${r},${g},${b},${alpha})`; }

  function showToast(text,ms=1300){ const el=document.createElement('div'); el.className='rc-toast'; el.textContent=text; document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('visible')); setTimeout(()=>{ el.classList.remove('visible'); setTimeout(()=>el.remove(),220); }, ms); }

  // arrow animation (subtle)
  let targetAngle=0, currentAngle=0, anim=false;
  function startArrowLoop(){ function onScroll(){ const max=document.documentElement.scrollHeight - window.innerHeight; const pct = max>0 ? (window.scrollY/max):0; targetAngle = pct * ARROW_MULTIPLIER; if (!anim){ anim=true; requestAnimationFrame(step); } } function step(){ currentAngle += (targetAngle-currentAngle)*0.12; const el=document.getElementById('compassArrow'); if (el) el.style.transform = `translate(-50%,-50%) rotate(${currentAngle}deg)`; if (Math.abs(targetAngle-currentAngle) > 0.01) requestAnimationFrame(step); else anim=false; } window.addEventListener('scroll', ()=>requestAnimationFrame(onScroll), {passive:true}); onScroll(); }

  // Start
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // expose helpers
  window.__rc = { buildWedges, placeRingLabels, openModeDialog };

})();