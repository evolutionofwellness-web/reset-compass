// script.js - hardened, defensive, and with safe fallbacks.
// Keeps UI rendering even if an enhancement fails.

(function(){
  'use strict';

  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const STREAK_KEY = 'resetCompassStreak';
  const LAST_DAY_KEY = 'resetCompassLastDay';
  const LONGEST_KEY = 'resetCompassLongest';
  const LAST_MODE_DAY_KEY = 'resetCompassLastModeDay';
  const REVIEWS_KEY = 'resetCompassReviews';
  const PWA_DISMISSED_KEY = 'resetCompassPWADismissed';
  const ACHIEVEMENTS_KEY = 'resetCompassAchievements';
  const ONBOARDING_KEY = 'resetCompassOnboardingComplete';

  const ACHIEVEMENTS = [
    { id: 'streak_7', name: '7 Day Warrior', emoji: '⚡', threshold: 7, type: 'streak' },
    { id: 'streak_30', name: '30 Day Champion', emoji: '👑', threshold: 30, type: 'streak' },
    { id: 'streak_100', name: '100 Day Legend', emoji: '🏆', threshold: 100, type: 'streak' },
    { id: 'activities_10', name: 'Getting Started', emoji: '🌟', threshold: 10, type: 'total' },
    { id: 'activities_50', name: 'Wellness Pro', emoji: '💪', threshold: 50, type: 'total' },
    { id: 'activities_100', name: 'Reset Master', emoji: '🎯', threshold: 100, type: 'total' }
  ];

  // MODES will be loaded from window.MODES by modes-loader.js
  let MODES = [];

  // QUICK_WINS will be built from loaded modes
  let QUICK_WINS = {};

  // DOM refs (populated after DOMContentLoaded)
  let compassWedges, compassRing, compassContainer, modesGrid, dialogQuickWins, globalQuickWinsList, startQuickWinBtn, startResetBtn, historyDialog, historyDonut, historyStats, historyTimeline, clearHistoryBtn;
  let deferredPrompt = null;

  function $(sel){ return document.querySelector(sel); }
  function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

  function init(){
    checkOnboarding();
    
    compassWedges = $('#compassWedges');
    compassRing = $('#compassRing');
    compassContainer = $('#compassContainer');
    modesGrid = $('#modesGrid');
    dialogQuickWins = $('#dialogQuickWins');
    globalQuickWinsList = $('#globalQuickWins');
    startQuickWinBtn = $('#startQuickWinBtn');
    startResetBtn = $('#startResetBtn');
    historyDialog = $('#historyDialog');
    historyDonut = $('#historyDonut');
    historyStats = $('#historyStats');
    historyTimeline = $('#historyTimeline');
    clearHistoryBtn = $('#clearHistoryBtn');

    applySavedTheme();
    initHistory();
    updateStreakDisplay();
    updateAchievements();
    wireGlobalHandlers();
    initPWAInstall();
    initReviews();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) startArrowLoop();
    
    // Wait for modes to load, then render UI
    if (window.MODES && window.MODES.length > 0) {
      onModesLoaded();
    } else {
      window.addEventListener('modes:loaded', onModesLoaded);
    }
  }
  
  function checkOnboarding(){
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      window.location.href = 'onboarding.html';
    }
  }
  
  function onModesLoaded(){
    // Convert loaded modes to internal format
    MODES = (window.MODES || []).map(m => ({
      id: m.id,
      name: m.title,
      color: m.color,
      description: m.description,
      emoji: getEmojiForMode(m.id),
      altDesc: m.description,
      activities: m.activities
    }));
    
    renderModes();
    safeBuildWedges();
    safePlaceRingLabels();
    renderGlobalQuickWins();
  }
  
  function getEmojiForMode(modeId){
    const emojiMap = {
      'surviving': '🛟',
      'drifting': '☁️',
      'grounded': '🧘',
      'growing': '🌱'
    };
    return emojiMap[modeId] || '✨';
  }

  /* Rendering */
  function renderModes(){
    if (!modesGrid) return;
    try {
      modesGrid.innerHTML = MODES.map(m=>`
        <button class="mode-card" data-mode-id="${m.id}" style="--mode-color:${m.color}">
          <div class="mode-emoji">${m.emoji}</div>
          <div class="mode-meta">
            <div class="mode-name">${escapeHtml(m.name)}</div>
            <div class="mode-desc">${escapeHtml(m.altDesc)}</div>
            <div class="mode-hint">👆 Tap to see activities</div>
          </div>
        </button>
      `).join('');
    } catch (e){
      console.error('renderModes failed', e);
      modesGrid.innerHTML = '<p style="color:var(--text-secondary)">Modes unavailable</p>';
    }
  }

  function safeBuildWedges(){
    try {
      buildWedgesAndSeparators();
    } catch (err) {
      console.error('buildWedges failed, applying fallback', err);
      // fallback: simple 4-color wheel without separators
      if (compassWedges){
        const colors = MODES.map(m => m.color).join(', ');
        compassWedges.style.background = `conic-gradient(from -45deg, ${colors})`;
      }
    }
  }

  function buildWedgesAndSeparators(){
    if (!compassWedges) return;
    const N = MODES.length;
    const portion = 360 / N;
    const gap = 0.8;
    const parts = [];
    for (let i=0;i<N;i++){
      const start = +(i*portion).toFixed(3);
      const end = +((i+1)*portion).toFixed(3);
      const wedgeEnd = end - gap;
      const color = MODES[i].color;
      parts.push(`${color} ${start}deg ${wedgeEnd}deg`);
      parts.push(`rgba(0,0,0,0.36) ${wedgeEnd}deg ${end}deg`);
    }
    compassWedges.style.background = `conic-gradient(from -45deg, ${parts.join(',')})`;
    compassWedges.style.filter = 'saturate(1.3) contrast(1.15) brightness(1.1)';
  }

  function safePlaceRingLabels(){
    try {
      placeRingLabels();
    } catch (e){
      console.error('placeRingLabels failed', e);
      // no-op: labels optional, UI should still show the wheel
    }
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
    try {
      // Build QUICK_WINS from loaded modes
      QUICK_WINS = {};
      MODES.forEach(m => {
        if (m.activities) {
          QUICK_WINS[m.id] = m.activities.map(a => ({
            text: a.title,
            hint: a.explain
          }));
        }
      });
      
      const all = [];
      Object.values(QUICK_WINS).forEach(arr => arr.forEach(a => { if (!all.find(x=>x.text===a.text)) all.push(a); }));
      globalQuickWinsList.innerHTML = all.map((a, idx) => `
        <li style="animation-delay: ${idx * 0.05}s">
          <div class="activity-row">
            <div style="max-width:70%">${escapeHtml(a.text)}<div class="activity-instruction">${escapeHtml(a.hint)}</div></div>
            <div><button class="select-global-activity" data-activity="${escapeHtml(a.text)}">✓ Select</button></div>
          </div>
          <textarea class="activity-note" data-activity="${escapeHtml(a.text)}" placeholder="Add notes (optional)" hidden></textarea>
        </li>
      `).join('');
      if (startQuickWinBtn) startQuickWinBtn.disabled = true;
    } catch (e) {
      console.error('renderGlobalQuickWins failed', e);
      globalQuickWinsList.innerHTML = '<li style="color:var(--text-secondary)">Quick Wins unavailable</li>';
    }
  }

  /* History and storage */
  function initHistory(){ try{ JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }catch(e){ localStorage.setItem(HISTORY_KEY,'[]'); } }
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
    } catch(e){ console.warn(e); return false; }
  }

  function updateStreakDisplay(){
    const s = Number(localStorage.getItem(STREAK_KEY) || 0);
    const el = document.getElementById('streakBadge');
    if (el) el.textContent = `Daily streak: 🔥 ${s}`;
  }

  function updateAchievements(){
    const streak = Number(localStorage.getItem(STREAK_KEY) || 0);
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const totalActivities = history.length;
    let unlocked = [];
    try { unlocked = JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]'); } catch(e){ unlocked = []; }
    
    const newAchievements = [];
    ACHIEVEMENTS.forEach(ach => {
      const value = ach.type === 'streak' ? streak : totalActivities;
      if (value >= ach.threshold && !unlocked.includes(ach.id)){
        unlocked.push(ach.id);
        newAchievements.push(ach);
      }
    });
    
    if (newAchievements.length > 0){
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
      newAchievements.forEach(ach => showAchievementUnlock(ach));
    }
    
    renderAchievementBadges(unlocked);
  }

  function renderAchievementBadges(unlockedIds){
    const container = document.getElementById('achievementBadges');
    if (!container) return;
    
    const unlockedAchievements = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id));
    if (unlockedAchievements.length === 0){
      container.innerHTML = '';
      return;
    }
    
    container.innerHTML = unlockedAchievements.map(ach => 
      `<div class="achievement-badge" title="${escapeHtml(ach.name)}">
        <span>${ach.emoji}</span>
        <span>${escapeHtml(ach.name)}</span>
      </div>`
    ).join('');
  }

  function showAchievementUnlock(achievement){
    const celebration = document.createElement('div');
    celebration.className = 'achievement-unlock-celebration';
    celebration.innerHTML = `
      <div class="achievement-unlock-content">
        <div class="achievement-unlock-emoji">${achievement.emoji}</div>
        <div class="achievement-unlock-text">
          <div class="achievement-unlock-title">Achievement Unlocked!</div>
          <div class="achievement-unlock-name">${escapeHtml(achievement.name)}</div>
        </div>
      </div>
    `;
    document.body.appendChild(celebration);
    
    setTimeout(() => celebration.classList.add('visible'), 50);
    setTimeout(() => {
      celebration.classList.remove('visible');
      setTimeout(() => celebration.remove(), 600);
    }, 4000);
    
    createConfetti();
  }

  function createConfetti(){
    const colors = ['#2f80ed', '#00c06b', '#ffbf3b', '#ff5f6d', '#00AFA0', '#ffd700'];
    for(let i = 0; i < 30; i++){
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 0.3 + 's';
      confetti.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 2500);
    }
  }

  function recordActivities(entries){
    if (!entries || !entries.length) return;
    const today = todayKey();
    const modeEntries = entries.filter(e => e.modeId);
    const lastModeDay = localStorage.getItem(LAST_MODE_DAY_KEY);
    if (modeEntries.length > 0 && lastModeDay === today){ showComeBackDialog(); return; }

    let hist = [];
    try { hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e){ hist = []; }
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
    createCompletionCelebration(entries.length);
    updateAchievements();
    setTimeout(()=> openHistoryDialog(), 420);
    if (modeEntries.length > 0) setTimeout(()=> showComeBackDialog(), 900);
  }

  function createCompletionCelebration(count){
    const celebration = document.createElement('div');
    celebration.className = 'completion-celebration';
    celebration.innerHTML = `
      <div class="completion-icon">✨</div>
      <div class="completion-text">Great work!</div>
    `;
    document.body.appendChild(celebration);
    
    setTimeout(() => celebration.classList.add('visible'), 50);
    setTimeout(() => {
      celebration.classList.remove('visible');
      setTimeout(() => celebration.remove(), 500);
    }, 2000);
    
    createCompletionParticles();
  }

  function createCompletionParticles(){
    const colors = ['#2f80ed', '#00c06b', '#ffbf3b', '#ff5f6d', '#00AFA0'];
    for(let i = 0; i < 20; i++){
      const particle = document.createElement('div');
      particle.className = 'completion-particle';
      const angle = (Math.PI * 2 * i) / 20;
      const distance = 100 + Math.random() * 100;
      particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
      particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      particle.style.left = '50%';
      particle.style.top = '50%';
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);
    }
  }

  function openHistoryDialog(){
    if (!historyDialog) return;
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const counts = {};
    MODES.forEach(m => counts[m.name] = 0);
    
    const modeHistory = history.filter(h => h.modeId);
    modeHistory.forEach(h => { if (counts[h.modeName] !== undefined) counts[h.modeName] = (counts[h.modeName] || 0) + 1; });

    if (historyStats){
      historyStats.innerHTML = '';
      const totalModeActivities = modeHistory.length;
      const longest = Number(localStorage.getItem(LONGEST_KEY) || 0);
      historyStats.insertAdjacentHTML('beforeend', `<div class="stat-card"><div class="stat-value">${history.length}</div><div class="stat-label">Total resets</div></div>`);
      historyStats.insertAdjacentHTML('beforeend', `<div class="stat-card"><div class="stat-value">${longest}</div><div class="stat-label">Longest streak</div></div>`);
      MODES.forEach(m => {
        const c = counts[m.name] || 0;
        const pct = totalModeActivities ? Math.round((c/totalModeActivities)*100) : 0;
        historyStats.insertAdjacentHTML('beforeend', `<div class="stat-card" style="border-left:8px solid ${m.color};"><div class="stat-value">${c}</div><div class="stat-label">${escapeHtml(m.name)} • ${pct}%</div></div>`);
      });
    }

    drawDonut(MODES.map(m => ({ value: counts[m.name] || 0, color: m.color })));

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
    try {
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
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-primary') || '#fff'; ctx.font = '700 18px system-ui,Arial'; ctx.textAlign = 'center';
      ctx.fillText(total, cx, cy+6);
    } catch (e) {
      console.error('drawDonut error', e);
    }
  }

  /* UI wiring (delegated) */
  function wireGlobalHandlers(){
    // nav dropdown
    const navToggle = $('#navMenuToggle');
    const navMenu = $('#navDropdown');
    if (navToggle && navMenu){
      navToggle.addEventListener('click', (ev)=>{ ev.stopPropagation(); const isHidden = navMenu.getAttribute('aria-hidden') !== 'false'; navMenu.setAttribute('aria-hidden', isHidden ? 'false' : 'true'); navToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false'); });
      document.addEventListener('click', (ev)=>{ if (navMenu.getAttribute('aria-hidden') === 'false' && !navMenu.contains(ev.target) && ev.target !== navToggle) { navMenu.setAttribute('aria-hidden','true'); navToggle.setAttribute('aria-expanded','false'); }});
    }

    // global delegation
    document.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;

      const actionEl = e.target.closest('[data-action]');
      if (actionEl){
        const action = actionEl.dataset.action;
        if (action === 'quick-wins'){ 
          safeShowDialog($('#quickWinsDialog')); 
          // Initialize new Quick Wins view with shuffle
          if (window.QuickWinsView) {
            window.QuickWinsView.init({
              logActivity: function(payload) {
                // Convert to existing format
                const entry = {
                  modeId: null,
                  modeName: 'Quick Win',
                  modeColor: '#00AFA0',
                  action: payload.activity.text,
                  note: ''
                };
                recordActivities([entry]);
              }
            });
          }
          return; 
        }
        if (action === 'history'){ openHistoryDialog(); return; }
        if (action === 'about'){ window.location.href = './about.html'; return; }
        if (action === 'home'){ window.location.href = './index.html'; return; }
        if (action === 'toggle-theme'){ toggleTheme(); return; }
        if (action === 'feedback'){ safeShowDialog($('#feedbackDialog')); return; }
        if (action === 'ratings-reviews'){ openRatingsDialog(); return; }
        if (action === 'privacy-policy'){ safeShowDialog($('#privacyDialog')); return; }
        if (action === 'terms'){ safeShowDialog($('#termsDialog')); return; }
      }

      // ring label or mode-card
      const ringBtn = e.target.closest('.ring-btn[data-mode-id]');
      if (ringBtn){ openModeDialog(ringBtn.dataset.modeId); return; }
      const modeCard = e.target.closest('.mode-card[data-mode-id]');
      if (modeCard){ openModeDialog(modeCard.dataset.modeId); return; }

      // quick wins select
      const gsel = e.target.closest('.select-global-activity');
      if (gsel){ 
        e.preventDefault(); 
        gsel.classList.toggle('active'); 
        const ta = gsel.closest('li').querySelector('.activity-note'); 
        if (ta) ta.hidden = !gsel.classList.contains('active'); 
        const activeCount = globalQuickWinsList.querySelectorAll('.select-global-activity.active').length;
        if (startQuickWinBtn) {
          startQuickWinBtn.disabled = activeCount === 0;
          const hint = document.getElementById('quickWinHint');
          if (hint) {
            hint.textContent = activeCount === 0 ? 'Select an activity first' : `${activeCount} selected`;
          }
        }
        return; 
      }

      // dialog selects
      const msel = e.target.closest('.select-activity');
      if (msel){ 
        e.preventDefault(); 
        if (msel.textContent.trim().toLowerCase()==='locked'){ 
          showComeBackDialog(); 
          return; 
        } 
        msel.classList.toggle('active'); 
        const ta = msel.closest('li').querySelector('.activity-note'); 
        if (ta) ta.hidden = !msel.classList.contains('active'); 
        const activeCount = dialogQuickWins.querySelectorAll('.select-activity.active').length;
        if (startResetBtn) {
          startResetBtn.disabled = activeCount === 0;
          const hint = document.getElementById('completeHint');
          if (hint) {
            hint.textContent = activeCount === 0 ? 'Select an activity first' : `${activeCount} selected`;
          }
        }
        return; 
      }

      if (e.target.closest('.dialog-close') || e.target.closest('.dialog-cancel')){ const d = e.target.closest('dialog'); if (d){ safeCloseDialog(d); clearDialogSelections(); } }
    }, true);

    // startQuickWinBtn handler
    if (startQuickWinBtn){
      startQuickWinBtn.addEventListener('click', ()=>{
        const selected = Array.from(globalQuickWinsList.querySelectorAll('.select-global-activity.active'));
        if (!selected.length) return;
        const records = selected.map(b => { const ta = b.closest('li').querySelector('.activity-note'); return { modeId:null, action: b.dataset.activity, note: ta ? (ta.value||'').trim() : '' }; });
        recordActivities(records);
        safeCloseDialog($('#quickWinsDialog'));
        clearDialogSelections();
      });
    }

    // clear history
    if (clearHistoryBtn){
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
  }

  /* Mode dialog flow */
  function openModeDialog(modeId){
    console.log('[OpenModeDialog] Opening mode:', modeId);
    const m = MODES.find(x => x.id === modeId || x.id === String(modeId));
    if (!m) {
      console.error('[OpenModeDialog] Mode not found:', modeId);
      return;
    }
    console.log('[OpenModeDialog] Found mode:', m.name, 'with', m.activities?.length || 0, 'activities');
    
    const title = $('#modeDialogTitle'); const desc = $('#dialogModeDescription'); const accent = $('#modeAccent');
    if (title) title.textContent = m.name;
    if (desc) desc.textContent = m.description;
    if (accent) accent.style.background = m.color;

    // Check if mode is locked for today
    const locked = (localStorage.getItem(LAST_MODE_DAY_KEY) === todayKey());
    
    if (locked) {
      console.log('[OpenModeDialog] Mode is locked for today');
      // Show locked message
      if (!dialogQuickWins) return;
      dialogQuickWins.innerHTML = `
        <li style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
          <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px;">
            Mode completed for today
          </div>
          <div style="font-size: 14px; color: var(--text-secondary);">
            Come back tomorrow to continue your streak!<br>
            Quick Wins are always available.
          </div>
        </li>
      `;
      safeShowDialog($('#modeDialog'));
      return;
    }

    // Use Shuffle Mode for all activities
    if (window.ShuffleMode) {
      safeShowDialog($('#modeDialog'));
      
      // Get activities for this mode
      const activities = m.activities || [];
      console.log('[OpenModeDialog] Passing', activities.length, 'activities to ShuffleMode');
      
      // Additional validation
      if (activities.length === 0) {
        console.error('[OpenModeDialog] No activities available for mode:', modeId);
        if (dialogQuickWins) {
          dialogQuickWins.innerHTML = `
            <li style="text-align: center; padding: 40px 20px;">
              <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
              <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px;">
                No activities available
              </div>
              <div style="font-size: 14px; color: var(--text-secondary);">
                Please try again later or contact support.
              </div>
            </li>
          `;
        }
        return;
      }
      
      window.ShuffleMode.init({
        mode: modeId,
        activities: activities,
        logActivity: function(payload) {
          // Convert to existing format
          const entry = {
            modeId: payload.mode,
            modeName: m.name,
            modeColor: m.color,
            action: payload.activity.text || payload.activity.title,
            note: payload.note || ''
          };
          recordActivities([entry]);
          safeCloseDialog($('#modeDialog'));
          clearDialogSelections();
        },
        onClose: function() {
          safeCloseDialog($('#modeDialog'));
        }
      });
      return;
    }

    // Fallback to original full list view
    showFullActivityList(modeId);
  }
  
  // Helper function for full activity list view (original behavior)
  function showFullActivityList(modeId) {
    const m = MODES.find(x => x.id === modeId || x.id === String(modeId));
    if (!m || !dialogQuickWins) return;
    
    const arr = QUICK_WINS[m.id] || [];
    dialogQuickWins.innerHTML = arr.map((a, idx) => `
      <li style="animation-delay: ${idx * 0.05}s">
        <div class="activity-row">
          <div style="max-width:70%">${escapeHtml(a.text)}<div class="activity-instruction">${escapeHtml(a.hint)}</div></div>
          <div><button class="select-activity" data-activity="${escapeHtml(a.text)}">✓ Select</button></div>
        </div>
        <textarea class="activity-note" data-activity="${escapeHtml(a.text)}" placeholder="Add notes (optional)" hidden></textarea>
      </li>
    `).join('');

    if (startResetBtn) startResetBtn.disabled = true;

    // wire startResetBtn (stable)
    if (startResetBtn){
      startResetBtn.onclick = function(){
        const selected = Array.from(dialogQuickWins.querySelectorAll('.select-activity.active'));
        if (!selected.length) return;
        if (localStorage.getItem(LAST_MODE_DAY_KEY) === todayKey()){ showComeBackDialog(); return; }
        const records = selected.map(b => { const ta = b.closest('li').querySelector('.activity-note'); return { modeId: m.id, modeName: m.name, modeColor: m.color, action: b.dataset.activity, note: ta ? (ta.value||'').trim() : '' }; });
        recordActivities(records);
        safeCloseDialog($('#modeDialog'));
        clearDialogSelections();
      };
    }

    safeShowDialog($('#modeDialog'));
  }

  /* Dialog helpers and utilities */
  function safeShowDialog(d){
    if (!d) return;
    try {
      d.classList.add('page-transition-enter');
      setTimeout(() => d.classList.remove('page-transition-enter'), 400);
      if (typeof d.showModal === 'function') d.showModal();
      else { d.setAttribute('open',''); d.style.display='block'; }
      
      d.scrollTop = 0;
      const scrollableContent = d.querySelector('.dialog-content, .mode-activities, .quick-wins-list, .history-timeline');
      if (scrollableContent) {
        scrollableContent.scrollTop = 0;
      }
      
      // Store the element that was focused before opening the modal
      d._previouslyFocused = document.activeElement;
      
      // Setup focus trap for accessibility
      setupFocusTrap(d);
      
      // Setup ESC key handler
      setupEscapeHandler(d);
      
      const f = d.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (f) setTimeout(()=>f.focus(), 30);
    } catch(e){ console.warn('safeShowDialog failed', e); }
  }
  
  /**
   * Setup ESC key handler to close modal dialogs
   */
  function setupEscapeHandler(dialog) {
    if (!dialog) return;
    
    // Remove any existing escape handler
    if (dialog._escapeHandler) {
      dialog.removeEventListener('keydown', dialog._escapeHandler);
    }
    
    dialog._escapeHandler = function(e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        safeCloseDialog(dialog);
        clearDialogSelections();
      }
    };
    
    dialog.addEventListener('keydown', dialog._escapeHandler);
  }
  
  /**
   * Setup focus trap for modal dialogs (accessibility)
   * Ensures Tab/Shift+Tab cycles within the dialog
   */
  function setupFocusTrap(dialog) {
    if (!dialog) return;
    
    // Remove any existing focus trap listener
    if (dialog._focusTrapHandler) {
      dialog.removeEventListener('keydown', dialog._focusTrapHandler);
    }
    
    dialog._focusTrapHandler = function(e) {
      if (e.key !== 'Tab') return;
      
      const focusableElements = dialog.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // Shift + Tab: moving backwards
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab: moving forwards
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    dialog.addEventListener('keydown', dialog._focusTrapHandler);
  }

  function safeCloseDialog(d){
    if (!d) return;
    try {
      // Clean up focus trap
      if (d._focusTrapHandler) {
        d.removeEventListener('keydown', d._focusTrapHandler);
        d._focusTrapHandler = null;
      }
      
      // Clean up escape handler
      if (d._escapeHandler) {
        d.removeEventListener('keydown', d._escapeHandler);
        d._escapeHandler = null;
      }
      
      d.classList.add('page-transition-out');
      setTimeout(() => {
        d.classList.remove('page-transition-out');
        if (typeof d.close === 'function' && d.open) d.close();
        else { d.removeAttribute('open'); d.style.display='none'; }
        
        // Return focus to previously focused element
        if (d._previouslyFocused && typeof d._previouslyFocused.focus === 'function') {
          d._previouslyFocused.focus();
          d._previouslyFocused = null;
        }
      }, 300);
    } catch(e){ console.warn('safeCloseDialog', e); }
  }

  function clearDialogSelections(){
    $all('.select-activity').forEach(b => b.classList.remove('active'));
    $all('.activity-note').forEach(t => { t.hidden = true; t.value = ''; });
    $all('.select-global-activity').forEach(b => b.classList.remove('active'));
    if (startResetBtn) {
      startResetBtn.disabled = true;
      const hint = document.getElementById('completeHint');
      if (hint) hint.textContent = 'Select an activity first';
    }
    if (startQuickWinBtn) {
      startQuickWinBtn.disabled = true;
      const hint = document.getElementById('quickWinHint');
      if (hint) hint.textContent = 'Select an activity first';
    }
  }

  function showComeBackDialog(){ safeShowDialog($('#comeBackDialog')); }

  /* Utilities */
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function hexToRgba(hex, a=1){ try{ const h = hex.replace('#',''); const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16); const r = (bigint>>16)&255; const g = (bigint>>8)&255; const b = bigint&255; return `rgba(${r},${g},${b},${a})`; }catch(e){ return `rgba(0,0,0,${a})`; } }
  function showToast(text, ms=1400){ const el = document.createElement('div'); el.className='rc-toast'; el.textContent=text; document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('visible')); setTimeout(()=>{ el.classList.remove('visible'); setTimeout(()=>el.remove(),220); }, ms); }
  function toggleTheme(){ 
    const light = document.documentElement.classList.toggle('light'); 
    try{ localStorage.setItem(THEME_KEY, light?'light':'dark'); }catch(e){} 
    updateThemeToggleIcon(light);
  }
  
  function updateThemeToggleIcon(isLight){
    const toggleText = document.getElementById('themeToggleText');
    if(toggleText){
      toggleText.textContent = isLight ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
  }
  
  function applySavedTheme(){ 
    try{ 
      const isLight = localStorage.getItem(THEME_KEY)==='light';
      if(isLight) document.documentElement.classList.add('light'); 
      updateThemeToggleIcon(isLight);
    }catch(e){} 
  }

  /* Arrow animation */
  let targetAngle=0, currentAngle=0, anim=false;
  function startArrowLoop(){
    function onScroll(){ const max = document.documentElement.scrollHeight - window.innerHeight; const pct = max>0 ? (window.scrollY/max) : 0; targetAngle = pct * 5760; if (!anim){ anim=true; requestAnimationFrame(step); } }
    function step(){ currentAngle += (targetAngle-currentAngle)*0.12; const el = $('#compassArrow'); if (el) el.style.transform = `translate(-50%,-50%) rotate(${currentAngle}deg)`; if (Math.abs(targetAngle-currentAngle) > 0.01) requestAnimationFrame(step); else anim=false; }
    window.addEventListener('scroll', ()=>requestAnimationFrame(onScroll), {passive:true});
    onScroll();
  }

  /* PWA Install */
  function initPWAInstall(){
    const banner = $('#pwaInstallBanner');
    const installBtn = $('#pwaInstallBtn');
    const dismissBtn = $('#pwaDismissBtn');
    const stickyBtn = $('#stickyInstallBtn');
    
    if (!banner || !installBtn || !dismissBtn) return;
    
    let isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    let isAndroid = /Android/.test(navigator.userAgent);
    let isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone || 
                      document.referrer.includes('android-app://');
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const dismissed = localStorage.getItem(PWA_DISMISSED_KEY);
      if (!dismissed) banner.style.display = 'flex';
      
      if (!isStandalone && stickyBtn) {
        setTimeout(() => {
          stickyBtn.classList.add('show');
        }, 3000);
      }
    });
    
    if (stickyBtn) {
      if (isIOS && !isStandalone) {
        setTimeout(() => {
          stickyBtn.classList.add('show');
          stickyBtn.innerHTML = '<span class="icon">📱</span><span>Add to Home</span>';
        }, 3000);
      } else if (isAndroid && !isStandalone && !deferredPrompt) {
        setTimeout(() => {
          stickyBtn.classList.add('show');
        }, 3000);
      }
      
      stickyBtn.addEventListener('click', async () => {
        if (isIOS) {
          showIOSInstructions();
        } else if (deferredPrompt) {
          deferredPrompt.prompt();
          const result = await deferredPrompt.userChoice;
          if (result.outcome === 'accepted') {
            showToast('Thanks for installing!');
            stickyBtn.classList.remove('show');
          }
          deferredPrompt = null;
        } else if (isAndroid) {
          showAndroidInstructions();
        } else {
          showToast('Open this site on your phone to install');
        }
      });
    }
    
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') showToast('Thanks for installing!');
      deferredPrompt = null;
      banner.style.display = 'none';
    });
    
    dismissBtn.addEventListener('click', () => {
      banner.style.display = 'none';
      localStorage.setItem(PWA_DISMISSED_KEY, 'true');
    });
    
    window.addEventListener('appinstalled', () => {
      showToast('The Reset Compass installed successfully!');
      banner.style.display = 'none';
      if (stickyBtn) stickyBtn.classList.remove('show');
    });
  }
  
  function showIOSInstructions(){
    const dialog = document.createElement('dialog');
    dialog.className = 'mode-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <button class="dialog-close" aria-label="Close dialog">&times;</button>
        <h2>📱 Add to Home Screen</h2>
        <p class="mode-description">Tap the Share button <strong>📤</strong> in your browser, then scroll down and tap <strong>"Add to Home Screen"</strong>.</p>
        <div class="dialog-actions">
          <button class="btn-primary dialog-close">Got it</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    safeShowDialog(dialog);
    dialog.addEventListener('close', () => dialog.remove());
  }
  
  function showAndroidInstructions(){
    const dialog = document.createElement('dialog');
    dialog.className = 'mode-dialog';
    dialog.innerHTML = `
      <div class="dialog-content">
        <button class="dialog-close" aria-label="Close dialog">&times;</button>
        <h2>📱 Add to Home Screen</h2>
        <p class="mode-description">Tap the menu button <strong>⋮</strong> in your browser, then tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</p>
        <div class="dialog-actions">
          <button class="btn-primary dialog-close">Got it</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
    safeShowDialog(dialog);
    dialog.addEventListener('close', () => dialog.remove());
  }

  /* Reviews & Ratings */
  function initReviews(){
    const starRating = $('#starRating');
    const ratingValue = $('#ratingValue');
    const reviewForm = $('#reviewForm');
    const feedbackForm = document.querySelector('.feedback-form');
    
    if (starRating && ratingValue){
      const stars = starRating.querySelectorAll('.star');
      stars.forEach(star => {
        star.addEventListener('click', () => {
          const rating = star.dataset.rating;
          ratingValue.value = rating;
          stars.forEach((s, idx) => {
            s.classList.toggle('active', idx < rating);
          });
        });
      });
    }
    
    if (reviewForm){
      reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(reviewForm);
        const rating = formData.get('rating');
        const name = formData.get('name');
        const review = formData.get('review');
        
        if (!rating){ showToast('Please select a rating'); return; }
        if (!name || name.trim() === ''){ showToast('Please enter your name'); return; }
        if (!review || review.trim() === ''){ showToast('Please enter your review'); return; }
        if (review.trim().length < 10){ showToast('Review must be at least 10 characters'); return; }
        
        const reviewObj = { rating, name: name.trim(), review: review.trim(), date: new Date().toISOString() };
        let reviews = [];
        try { reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]'); } catch(e){ reviews = []; }
        reviews.unshift(reviewObj);
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
        
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString()
        }).then(() => {
          showToast('Thank you for your review!');
          reviewForm.reset();
          if (starRating) starRating.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
          renderReviews();
          safeCloseDialog($('#ratingsDialog'));
        }).catch((err) => {
          console.error('Failed to submit review:', err);
          showToast('Review saved locally');
          renderReviews();
        });
      });
    }
    
    if (feedbackForm){
      feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(feedbackForm);
        const feedbackType = formData.get('type');
        const feedbackMessage = formData.get('message');
        
        if (!feedbackType || feedbackType === ''){ showToast('Please select feedback type'); return; }
        if (!feedbackMessage || feedbackMessage.trim() === ''){ showToast('Please enter your feedback'); return; }
        if (feedbackMessage.trim().length < 10){ showToast('Feedback must be at least 10 characters'); return; }
        
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(formData).toString()
        }).then(() => {
          showToast('Feedback sent successfully!');
          feedbackForm.reset();
          safeCloseDialog($('#feedbackDialog'));
        }).catch((err) => {
          console.error('Failed to submit feedback:', err);
          showToast('Failed to send feedback. Please try again.');
        });
      });
    }
  }

  function openRatingsDialog(){
    renderReviews();
    safeShowDialog($('#ratingsDialog'));
  }

  function renderReviews(){
    const reviewsList = $('#reviewsList');
    if (!reviewsList) return;
    
    let reviews = [];
    try { reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]'); } catch(e){ reviews = []; }
    
    if (reviews.length === 0){
      reviewsList.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to review!</p>';
      return;
    }
    
    reviewsList.innerHTML = reviews.slice(0, 10).map(r => {
      const stars = '★'.repeat(Number(r.rating)) + '☆'.repeat(5 - Number(r.rating));
      const date = new Date(r.date).toLocaleDateString();
      return `
        <div class="review-item">
          <div class="review-header">
            <div class="review-author">${escapeHtml(r.name)}</div>
            <div class="review-stars">${stars}</div>
          </div>
          <div class="review-text">${escapeHtml(r.review)}</div>
          <div class="review-date">${date}</div>
        </div>
      `;
    }).join('');
  }

  // init
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // expose for debug and for new modules
  window.__rc = { buildWedgesAndSeparators, placeRingLabels, openModeDialog, recordActivities };
  window.showToast = showToast; // Expose showToast globally for new modules

  // global error listener to avoid total breakage
  window.addEventListener('error', function(ev){ console.error('Unhandled error', ev.error || ev.message); showToast('An unexpected error occurred. UI fallback applied'); }, true);

})();

