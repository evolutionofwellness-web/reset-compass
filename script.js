// script.js
// Consolidated fixes and improvements:
// - clearer wedge separation + outer glow (CSS + conic gradient)
// - per-mode header accent and more side padding
// - select buttons reliably show notes and enable "Complete Selected" (both modes and quick wins)
// - "Complete Selected" records and opens History on both Quick Wins and Mode flows
// - one-mode-per-day enforcement with come-back dialog
// - dropdown closes on outside click; About page has no dropdown (safe no-op)
// - donut chart in History updates on record

(function(){
  'use strict';

  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const STREAK_KEY = 'resetCompassStreak';
  const LAST_DAY_KEY = 'resetCompassLastDay';
  const LONGEST_KEY = 'resetCompassLongest';
  const LAST_MODE_DAY_KEY = 'resetCompassLastModeDay';
  const INTRO_SEEN_KEY = 'resetCompassIntroSeen';

  const compassWedges = document.getElementById('compassWedges');
  const compassRing = document.getElementById('compassRing');
  const compassContainer = document.getElementById('compassContainer');
  const compassArrow = document.getElementById('compassArrow');

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
    4: { id:4, name:'Growing',   description:'Playful prompts to try something new or expand your horizon.', color:'#2f80ed', theme:{bg:'linear-gradient(180deg,#3a86ff33,#2f80ed55)', ring:'#2f80ed'} },
    3: { id:3, name:'Grounded',  description:'Reset and connect — slow the breath and root into the present.', color:'#00c06b', theme:{bg:'linear-gradient(180deg,#00d07f33,#00c06b55)', ring:'#00c06b'} },
    2: { id:2, name:'Drifting',  description:'Slow down and regain clarity with small clearing practices.', color:'#ffbf3b', theme:{bg:'linear-gradient(180deg,#ffd16633,#ffbf3b55)', ring:'#ffbf3b'} },
    1: { id:1, name:'Surviving', description:'Quick resets for focus and energy when things feel intense.', color:'#ff5f6d', theme:{bg:'linear-gradient(180deg,#ff808f33,#ff5f6d55)', ring:'#ff5f6d'} }
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

  async function init(){
    applySavedTheme();
    loadCanonicalModes();
    renderModes();
    renderCompass();
    renderGlobalQuickWins();
    initHistory();
    attachListeners();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) startArrowLoop();
  }

  function loadCanonicalModes(){
    modes = [canonical[4], canonical[3], canonical[2], canonical[1]];
  }

  function renderModes(){
    if (!modesGrid) return;
    modesGrid.innerHTML = modes.map(m => {
      return `<button class="mode-card" data-mode-id="${m.id}" style="--mode-color:${m.color}">
        <div class="mode-meta">
          <div class="mode-name">${escapeHtml(m.name)}</div>
          <div class="mode-desc">${escapeHtml(m.description)}</div>
          <div class="mode-hint">Tap to open activities</div>
        </div>
      </button>`;
    }).join('');
  }

  // Build wedges and ring labels; add deeper per-wedge gradient and separators via CSS overlay
  function renderCompass(){
    if (!compassWedges || !compassRing || !compassContainer) return;
    const portion = 360 / modes.length;
    // build conic gradient stops with inner radial gradient for subtle depth
    const stops = modes.map((m,i)=>{
      const color = m.color;
      const start = Math.round(i*portion);
      const end = Math.round((i+1)*portion);
      // add a slight radial fade by setting semi-opaque stop
      return `${color} ${start}deg ${end}deg`;
    }).join(',');
    compassWedges.style.background = `conic-gradient(from -45deg, ${stops})`;
    compassWedges.style.filter = 'saturate(1.12) contrast(1.06)';

    // place ring buttons
    compassRing.innerHTML = '';
    const rect = compassContainer.getBoundingClientRect();
    const cx = rect.width/2, cy = rect.height/2, radius = Math.min(cx,cy);
    modes.forEach((m,idx)=>{
      const portion = 360 / modes.length;
      const angle = ((idx + 0.5) * portion) - 45;
      const rad = (angle - 90) * (Math.PI/180);
      const rFactor = 0.58;
      const rPx = Math.min(Math.max(radius*rFactor, radius*0.28), radius*0.75);
      const left = cx + Math.cos(rad) * rPx;
      const top = cy + Math.sin(rad) * rPx;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ring-btn';
      btn.dataset.modeId = m.id;
      btn.innerHTML = `<span class="ring-label">${escapeHtml(m.name)}</span>`;
      btn.style.left = `${left}px`; btn.style.top = `${top}px`;
      btn.style.background = `linear-gradient(180deg, ${m.color}DD, rgba(0,0,0,0.08))`;
      btn.style.boxShadow = `0 30px 120px rgba(0,0,0,0.66), 0 0 48px ${hexToRgba(m.color,0.18)}`;
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
      </li>
    `).join('');

    // Wire quick-win select controls
    globalQuickWinsList.querySelectorAll('.select-global-activity').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        btn.classList.toggle('active');
        const ta = btn.closest('li').querySelector('.activity-note');
        if (ta) ta.hidden = !btn.classList.contains('active');
        startQuickWinBtn.disabled = !(globalQuickWinsList.querySelectorAll('.select-global-activity.active').length > 0);
      });
    });

    // ensure quick-win Complete works
    if (startQuickWinBtn) {
      startQuickWinBtn.replaceWith(startQuickWinBtn.cloneNode(true));
    }
    const newQuickBtn = document.getElementById('startQuickWinBtn');
    if (newQuickBtn) {
      newQuickBtn.disabled = !(globalQuickWinsList.querySelectorAll('.select-global-activity.active').length > 0);
      newQuickBtn.addEventListener('click', ()=>{
        const selected = Array.from(globalQuickWinsList.querySelectorAll('.select-global-activity.active'));
        if (!selected.length) return;
        const records = selected.map(b=>{
          const ta = b.closest('li').querySelector('.activity-note');
          return { modeId:null, action: b.dataset.activity, note: ta ? (ta.value||'').trim() : '' };
        });
        recordActivities(records);
        safeCloseDialog(quickWinsDialog);
        clearDialogSelections(quickWinsDialog);
      });
    }
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
    if (modeEntries.length > 0 && lastModeDay === today) { showComeBackDialog(); return; }

    let hist = [];
    try { hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e){ hist = []; }
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

    if (bumped && modeEntries.length>0 && window && window.navigator) {
      // pulse selected ring/card
      const mId = modeEntries[0].modeId;
      const ring = document.querySelector(`.ring-btn[data-mode-id="${mId}"]`);
      if (ring) ring.animate([{transform:'scale(1)'},{transform:'scale(1.14)'},{transform:'scale(1)'}],{duration:600});
    }

    // Immediately show a toast and then open history so user sees progress
    showToast(`${entries.length} activity${entries.length>1?'ies':'y'} recorded`);
    setTimeout(()=> openHistoryDialog(), 420);
    // If mode was recorded, show come-back soon after
    if (modeEntries.length>0) setTimeout(()=> showComeBackDialog(), 900);
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
      const slice = total ? (c.value/total)*Math.PI*2 : 0;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,start,start+slice);
      ctx.closePath();
      ctx.fillStyle = c.color;
      ctx.fill();
      start += slice;
    });
    ctx.beginPath();
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-elevated') || '#111';
    ctx.arc(cx,cy,r*0.56,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary') || '#fff';
    ctx.font = '700 18px system-ui,Arial'; ctx.textAlign = 'center';
    ctx.fillText(total, cx, cy+6);
  }

  function openHistoryDialog(){
    if (!historyDialog) return;
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const counts = {};
    modes.forEach(m => counts[m.name] = 0);
    history.forEach(h=> counts[h.modeName || 'Quick Win'] = (counts[h.modeName || 'Quick Win']||0) + 1);
    if (historyStats) {
      historyStats.innerHTML = '';
      const total = history.length;
      const longest = Number(localStorage.getItem(LONGEST_KEY) || 0);
      const base = `<div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total resets</div></div>
        <div class="stat-card"><div class="stat-value">${longest}</div><div class="stat-label">Longest streak</div></div>`;
      historyStats.insertAdjacentHTML('beforeend', base);
      modes.forEach(m=>{
        const c = counts[m.name] || 0;
        const pct = total ? Math.round((c/total)*100) : 0;
        historyStats.insertAdjacentHTML('beforeend', `<div class="stat-card" style="border-left:8px solid ${m.color};"><div class="stat-value">${c}</div><div class="stat-label">${escapeHtml(m.name)} • ${pct}%</div></div>`);
      });
    }
    const donutData = modes.map(m => ({ value: counts[m.name] || 0, color: m.color }));
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

  function showComeBackDialog(){ if (!comeBackDialog) { showToast('You already completed a mode today — come back tomorrow.'); return; } try{ comeBackDialog.showModal(); }catch(e){ alert('Come back tomorrow — you already completed a mode today.'); } }

  function attachListeners(){
    // dropdown index-only (safe no-op on About)
    if (navMenuToggle && navDropdown) {
      navMenuToggle.addEventListener('click', (ev)=>{ ev.stopPropagation(); const open = navDropdown.getAttribute('aria-hidden') === 'false'; navDropdown.setAttribute('aria-hidden', open ? 'true' : 'false'); navMenuToggle.setAttribute('aria-expanded', !open); });
      document.addEventListener('click', (ev)=>{ if (navDropdown.getAttribute('aria-hidden') === 'false' && !navDropdown.contains(ev.target) && ev.target !== navMenuToggle) { navDropdown.setAttribute('aria-hidden','true'); navMenuToggle.setAttribute('aria-expanded','false'); }});
    }

    // click delegation
    document.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      const actionEl = e.target.closest('[data-action]');
      if (actionEl) {
        const a = actionEl.dataset.action;
        if (a === 'quick-wins') { safeShowDialog(quickWinsDialog); return; }
        if (a === 'history') { openHistoryDialog(); return; }
        if (a === 'about') { window.location.href = './about.html'; return; }
        if (a === 'home') { window.location.href = './index.html'; return; }
        if (a === 'toggle-theme'){ const name = document.documentElement.classList.contains('light') ? 'dark' : 'light'; setTheme(name); return; }
      }

      // ring button
      const ringBtn = e.target.closest('.ring-btn[data-mode-id]');
      if (ringBtn) { openModeDialog(Number(ringBtn.dataset.modeId)); return; }

      // mode card
      const modeCard = e.target.closest('.mode-card[data-mode-id]');
      if (modeCard) { openModeDialog(Number(modeCard.dataset.modeId)); return; }

      // dialog close/cancel
      if (e.target.closest('.dialog-close') || e.target.closest('.dialog-cancel')) {
        const d = e.target.closest('dialog');
        if (d) { safeCloseDialog(d); clearDialogSelections(d); }
      }
    }, true);

    // compass click opens wedge (angle math)
    if (compassContainer) {
      compassContainer.addEventListener('click', function(e){
        const rect = compassContainer.getBoundingClientRect();
        const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const radius = Math.min(rect.width, rect.height)/2;
        if (dist > radius) return;
        if (dist < Math.max(28, radius*0.12)) return;
        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        angle = (angle + 90 + 360) % 360;
        const adjusted = (angle + 45 + 360) % 360;
        const idx = Math.floor(adjusted / (360/modes.length)) % modes.length;
        const mode = modes[idx];
        if (mode) openModeDialog(mode.id);
      }, true);
    }

    // clear history
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', ()=>{
        localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
        localStorage.removeItem(STREAK_KEY);
        localStorage.removeItem(LONGEST_KEY);
        localStorage.removeItem(LAST_DAY_KEY);
        localStorage.removeItem(LAST_MODE_DAY_KEY);
        updateStreakDisplay();
        if (historyDonut) historyDonut.getContext('2d').clearRect(0,0,historyDonut.width,historyDonut.height);
        if (historyStats) historyStats.innerHTML = '';
        if (historyTimeline) historyTimeline.innerHTML = '<div class="empty-history">History cleared.</div>';
        showToast('History cleared');
      });
    }
  }

  function openModeDialog(modeId){
    const m = modes.find(x=>x.id===Number(modeId));
    if (!m || !dialogQuickWins) return;
    currentMode = m;
    // set header accent and padding
    const hdr = document.getElementById('modeDialogHeader');
    const title = document.getElementById('modeDialogTitle');
    const desc = document.getElementById('dialogModeDescription');
    if (title) title.textContent = m.name;
    if (desc) desc.textContent = m.description || '';
    if (hdr){
      hdr.style.borderLeft = `6px solid ${m.color}`;
      // inject a colored accent block for extra uniqueness
      hdr.innerHTML = `<div class="accent" style="background:${m.color};vertical-align:middle"></div><div style="display:inline-block;vertical-align:middle;max-width:calc(100% - 40px)"><div class="mode-title">${escapeHtml(m.name)}</div><div class="mode-description">${escapeHtml(m.description)}</div></div>`;
    }

    const lastModeDay = localStorage.getItem(LAST_MODE_DAY_KEY);
    const locked = lastModeDay === todayKey();

    // inject activities
    const q = quickWinsMap[m.id] || [];
    dialogQuickWins.innerHTML = q.map(a=>`
      <li>
        <div class="activity-row">
          <div style="max-width:70%">${escapeHtml(a.text)}<div class="activity-instruction">${escapeHtml(a.hint)}</div></div>
          <div><button class="select-activity" data-activity="${escapeHtml(a.text)}">${locked ? 'Locked' : 'Select'}</button></div>
        </div>
        <textarea class="activity-note" data-activity="${escapeHtml(a.text)}" placeholder="Notes (optional)" hidden></textarea>
      </li>
    `).join('');

    // if locked, show message under list
    const existing = dialogQuickWins.nextElementSibling;
    if (existing && existing.classList && existing.classList.contains('rc-locked-note')) existing.remove();
    if (locked) {
      const note = document.createElement('div');
      note.className = 'rc-locked-note';
      note.style.marginTop = '12px';
      note.style.color = getComputedStyle(document.body).getPropertyValue('--text-secondary');
      note.textContent = 'You already completed a mode today — come back tomorrow to complete another mode. Quick Wins remain available.';
      dialogQuickWins.parentNode.insertBefore(note, dialogQuickWins.nextSibling);
    }

    // wire select buttons
    dialogQuickWins.querySelectorAll('.select-activity').forEach(btn=>{
      btn.addEventListener('click', (ev)=>{
        ev.preventDefault();
        if (locked) { showComeBackDialog(); return; }
        btn.classList.toggle('active');
        const ta = btn.closest('li').querySelector('.activity-note');
        if (ta) ta.hidden = !btn.classList.contains('active');
        startResetBtn.disabled = !(dialogQuickWins.querySelectorAll('.select-activity.active').length > 0);
      });
    });

    // wire startResetBtn reliably (remove previous listeners by cloning)
    const newBtn = startResetBtn.cloneNode(true);
    startResetBtn.parentNode.replaceChild(newBtn, startResetBtn);
    newBtn.disabled = true;
    newBtn.addEventListener('click', ()=>{
      const selected = dialogQuickWins.querySelectorAll('.select-activity.active');
      if (!selected.length) return;
      const lastModeDayCheck = localStorage.getItem(LAST_MODE_DAY_KEY);
      if (lastModeDayCheck === todayKey()) { showComeBackDialog(); return; }
      const records = Array.from(selected).map(b=>{
        const ta = b.closest('li').querySelector('.activity-note');
        return { modeId: m.id, modeName: m.name, modeColor: m.color, action: b.dataset.activity, note: ta ? (ta.value||'').trim() : '' };
      });
      recordActivities(records);
      safeCloseDialog(modeDialog);
      clearDialogSelections(modeDialog);
    });

    safeShowDialog(document.getElementById('modeDialog'));
  }

  function clearDialogSelections(d){
    if (dialogQuickWins) { dialogQuickWins.querySelectorAll('.select-activity').forEach(b=>b.classList.remove('active')); dialogQuickWins.querySelectorAll('.activity-note').forEach(t=>{ t.hidden=true; t.value=''; }); }
    if (globalQuickWinsList) { globalQuickWinsList.querySelectorAll('.select-global-activity').forEach(b=>b.classList.remove('active')); globalQuickWinsList.querySelectorAll('.activity-note').forEach(t=>{ t.hidden=true; t.value=''; }); }
    const sr = document.getElementById('startResetBtn'); if (sr) sr.disabled = true;
    const sq = document.getElementById('startQuickWinBtn'); if (sq) sq.disabled = true;
  }

  function applySavedTheme(){
    const saved = localStorage.getItem(THEME_KEY);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(saved || (prefersLight ? 'light' : 'dark'));
  }
  function setTheme(name){
    if (name === 'light') document.documentElement.classList.add('light'); else document.documentElement.classList.remove('light');
    try{ localStorage.setItem(THEME_KEY, name); }catch(e){}
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function hexToRgba(hex,alpha=1){ const h=hex.replace('#',''); const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h,16); const r=(bigint>>16)&255; const g=(bigint>>8)&255; const b=bigint&255; return `rgba(${r},${g},${b},${alpha})`; }

  function showToast(text, ms=1400){ const el=document.createElement('div'); el.className='rc-toast'; el.textContent=text; document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('visible')); setTimeout(()=>{ el.classList.remove('visible'); setTimeout(()=>el.remove(),220); }, ms); }

  // arrow lerp
  let targetAngle=0, currentAngle=0, animating=false;
  function startArrowLoop(){
    function onScroll(){ const max = document.documentElement.scrollHeight - window.innerHeight; const pct = max>0 ? (window.scrollY/max) : 0; targetAngle = pct * ARROW_MULTIPLIER; if (!animating){ animating=true; requestAnimationFrame(animate);} }
    function animate(){ currentAngle += (targetAngle - currentAngle) * 0.12; if (compassArrow) compassArrow.style.transform = `translate(-50%,-50%) rotate(${currentAngle}deg)`; if (Math.abs(targetAngle-currentAngle)>0.01) requestAnimationFrame(animate); else animating=false; }
    window.addEventListener('scroll', ()=>requestAnimationFrame(onScroll), {passive:true});
    onScroll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // expose for debugging
  window.__rc = { renderCompass, renderModes, openModeDialog };

})();