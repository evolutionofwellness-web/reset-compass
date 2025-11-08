// script.js
// Updates made to address your latest feedback:
// - wedge buttons slightly closer to center than previous outward move (rFactor tuned)
// - wedge click mapping remains (click anywhere inside wedge opens mode)
// - arrow spins much more: ARROW_MULTIPLIER = 5760 (double previous 2880)
// - Clear History wired and works; starts over streak values
// - Dropdown menus close when clicking outside or pressing Escape (works on both pages)
// - Mode activities now include short child-friendly instructions (already included in quickWinsMap)
// - Added stronger glow and vibrancy in CSS; JS sets colored glow on ring buttons
// - Complete Selected records activities, pulses mode, and opens History dialog automatically

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
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const navMenuToggle = document.getElementById('navMenuToggle');
  const navDropdown = document.getElementById('navDropdown');
  const navMenuToggleAbout = document.getElementById('navMenuToggleAbout');
  const navDropdownAbout = document.getElementById('navDropdownAbout');
  const themeToggles = Array.from(document.querySelectorAll('.theme-toggle, #themeToggle, #themeToggleAbout'));
  const streakBadges = document.querySelectorAll('#streakBadge');

  // Spin multiplier: double of previous 2880 => 5760
  const ARROW_MULTIPLIER = 5760;

  const canonical = {
    4: { id:4, name:'Growing',   description:'Small wins to build momentum', color:'#2f80ed' },
    3: { id:3, name:'Grounded',  description:'Reset and connect: root into the present', color:'#00c06b' },
    2: { id:2, name:'Drifting',  description:'Slow down and regain clarity', color:'#ffbf3b' },
    1: { id:1, name:'Surviving', description:'Quick resets for focus and energy', color:'#ff5f6d' }
  };

  // Activities with simple instructions
  const quickWinsMap = {
    3: [
      { text: 'Plant your feet and do a short stretch', hint: 'Stand tall, reach arms up, then slowly lower them.' },
      { text: 'Ground with deliberate breath: 4 4 4', hint: 'Breathe in 4, hold 4, breathe out 4. Repeat.' },
      { text: 'Put away one distracting item', hint: 'Pick one thing and put it out of sight.' },
      { text: 'Drink a glass of water', hint: 'Take a few big sips to feel refreshed.' }
    ],
    2: [
      { text: 'Take 3 deep breaths', hint: 'Slowly breathe in, then slowly out, three times.' },
      { text: 'Name 3 things you notice around you', hint: 'Say them out loud: color, sound, or object.' },
      { text: 'Lie down and relax for 2 minutes', hint: 'Close eyes, breathe gently, relax your body.' },
      { text: 'Slow-release breathing for 1 minute', hint: 'Breathe out longer than you breathe in.' }
    ],
    4: [
      { text: 'Try one small new challenge', hint: 'Pick something tiny and try it now.' },
      { text: 'Write a short reflection on progress', hint: 'Write one sentence about something you did well.' },
      { text: 'Do a 5-minute creative exercise', hint: 'Draw or write for five minutes.' },
      { text: 'Send an encouraging message to someone', hint: 'Write something kind to a friend.' }
    ],
    1: [
      { text: 'Take 3 quick breaths', hint: 'Quick deep breaths to regain focus.' },
      { text: 'Drink water', hint: 'Hydrate with a few sips.' },
      { text: 'Set one tiny goal for the next hour', hint: 'Create a small thing to do now.' },
      { text: 'Stand up and move for 60 seconds', hint: 'Stretch or walk around for one minute.' }
    ]
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

  // place ring buttons slightly closer to center (user requested slight inward move)
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

      // Slightly closer to center than previous outward heavy placement
      let rFactor = 0.60; // now slightly closer
      let rPx = radius * rFactor;
      const minR = Math.max(40, radius * 0.28);
      const maxR = Math.max(96, radius * 0.70);
      rPx = Math.min(Math.max(rPx, minR), maxR);

      const left = cx + Math.cos(rad) * rPx;
      const top = cy + Math.sin(rad) * rPx;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ring-btn';
      btn.dataset.modeId = mode.id;
      btn.innerHTML = `<span class="ring-label">${escapeHtml(mode.name)}</span>`;

      const base = mode.color || '#00AFA0';
      btn.style.background = `linear-gradient(180deg, ${base}EE, rgba(0,0,0,0.12))`;
      btn.style.setProperty('--mode-color', base);
      btn.style.color = getContrastColor(base);

      btn.style.left = `${left}px`;
      btn.style.top = `${top}px`;
      btn.style.zIndex = 16;
      btn.style.boxShadow = `0 32px 120px rgba(0,0,0,0.75), 0 0 40px ${hexToRgba(base, 0.2)}`;

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
      const stopColor = /^#([A-Fa-f0-9]{6})$/.test(color) ? color + 'F0' : color;
      const start = Math.round(i * portion);
      const end = Math.round((i + 1) * portion);
      return `${stopColor} ${start}deg ${end}deg`;
    });
    compassWedges.style.background = `conic-gradient(from -45deg, ${entries.join(',')})`;
    compassWedges.style.filter = 'saturate(1.14) contrast(1.10)';
  }

  function renderGlobalQuickWins() {
    if (!globalQuickWinsList) return;
    const items = [];
    Object.values(quickWinsMap).forEach(arr => arr.forEach(i => {
      if (!items.find(s => s.text === i.text)) items.push(i);
    }));
    globalQuickWinsList.innerHTML = items.map(w => `
      <li>
        <div class="activity-row">
          <div style="max-width:70%">${escapeHtml(w.text)}<div class="activity-instruction">${escapeHtml(w.hint)}</div></div>
          <div>
            <button class="select-global-activity" data-activity="${escapeHtml(w.text)}">Select</button>
          </div>
        </div>
        <textarea class="activity-note" data-activity="${escapeHtml(w.text)}" placeholder="Notes (optional)" hidden></textarea>
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

    if (bumped && currentMode) {
      const ring = document.querySelector(`.ring-btn[data-mode-id="${currentMode.id}"]`);
      const card = document.querySelector(`.mode-card[data-mode-id="${currentMode.id}"]`);
      [ring, card].forEach(el => {
        if (!el) return;
        el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }, { transform: 'scale(1)' }], { duration: 620, easing: 'cubic-bezier(.2,.9,.2,1)' });
      });
    }

    showToast(`${entries.length} activity${entries.length>1?'ies':'y'} recorded`);

    // After a short delay, open history so user sees progress
    setTimeout(() => { openHistoryDialog(); }, 520);
  }

  function safeShowDialog(d) {
    if (!d) return;
    if (typeof d.showModal === 'function') {
      try { d.showModal(); const f = d.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'); if (f) f.focus(); } catch (e) { console.warn(e); }
    } else { alert(d.querySelector('h2') ? d.querySelector('h2').textContent : 'Dialog'); }
  }
  function safeCloseDialog(d) { if (!d) return; try { if (typeof d.close === 'function' && d.open) d.close(); } catch (e) {} }

  function attachListeners() {
    // dropdown toggles: open/close and close when clicking outside
    function toggleDropdown(toggle, menu) {
      if (!toggle || !menu) return;
      toggle.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const open = menu.getAttribute('aria-hidden') === 'false';
        menu.setAttribute('aria-hidden', open ? 'true' : 'false');
        toggle.setAttribute('aria-expanded', !open);
      });
      // close when clicking outside
      document.addEventListener('click', (ev) => {
        if (!menu) return;
        if (menu.getAttribute('aria-hidden') === 'false' && !menu.contains(ev.target) && ev.target !== toggle) {
          menu.setAttribute('aria-hidden', 'true');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
      // close on Escape
      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && menu.getAttribute('aria-hidden') === 'false') {
          menu.setAttribute('aria-hidden', 'true');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
    toggleDropdown(navMenuToggle, navDropdown);
    toggleDropdown(navMenuToggleAbout, navDropdownAbout);

    // global click delegation for actions
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

      const ringBtn = e.target.closest('.ring-btn[data-mode-id]');
      if (ringBtn && ringBtn.dataset && ringBtn.dataset.modeId) { openModeDialog(Number(ringBtn.dataset.modeId)); return; }

      const modeCard = e.target.closest('.mode-card[data-mode-id]');
      if (modeCard && modeCard.dataset && modeCard.dataset.modeId) { openModeDialog(Number(modeCard.dataset.modeId)); return; }

      const gSel = e.target.closest('.select-global-activity');
      if (gSel && gSel.dataset && gSel.dataset.activity) {
        e.preventDefault();
        gSel.classList.toggle('active');
        const li = gSel.closest('li'); if (li) { const ta = li.querySelector('.activity-note'); if (ta) ta.hidden = !gSel.classList.contains('active'); }
        if (startQuickWinBtn) startQuickWinBtn.disabled = !(globalQuickWinsList.querySelectorAll('.select-global-activity.active').length > 0);
        return;
      }

      const selBtn = e.target.closest('.select-activity');
      if (selBtn && selBtn.dataset && selBtn.dataset.activity) {
        e.preventDefault();
        selBtn.classList.toggle('active');
        const li = selBtn.closest('li'); if (li) { const ta = li.querySelector('.activity-note'); if (ta) ta.hidden = !selBtn.classList.contains('active'); }
        if (startResetBtn) startResetBtn.disabled = !(dialogQuickWins.querySelectorAll('.select-activity.active').length > 0);
        return;
      }

      if (e.target.closest('.dialog-close') || e.target.closest('.dialog-cancel')) {
        const d = e.target.closest('dialog');
        if (d) { safeCloseDialog(d); clearDialogSelections(d); }
      }
    }, true);

    // mapping click inside compass to wedge (same as before)
    if (compassContainer) {
      compassContainer.addEventListener('click', function(e) {
        const rect = compassContainer.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const x = e.clientX;
        const y = e.clientY;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const radius = Math.min(rect.width, rect.height) / 2;
        if (dist > radius) return;
        if (dist < Math.max(28, radius * 0.14)) return;
        let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
        angleDeg = (angleDeg + 90 + 360) % 360;
        const adjusted = (angleDeg + 45 + 360) % 360;
        const portion = 360 / (modes.length || 4);
        const idx = Math.floor(adjusted / portion) % modes.length;
        const mode = modes[idx];
        if (mode) openModeDialog(mode.id);
      }, true);
    }

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

    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', function() {
        localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
        localStorage.removeItem(STREAK_KEY);
        localStorage.removeItem(LONGEST_KEY);
        localStorage.removeItem(LAST_DAY_KEY);
        updateStreakDisplay();
        if (historyStats) historyStats.innerHTML = '';
        if (historyTimeline) historyTimeline.innerHTML = '<div class="empty-history">History cleared.</div>';
        showToast('History cleared');
      });
    }

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        // close any open dropdowns
        if (navDropdown && navDropdown.getAttribute('aria-hidden') === 'false') { navDropdown.setAttribute('aria-hidden','true'); navMenuToggle.setAttribute('aria-expanded','false'); }
        if (navDropdownAbout && navDropdownAbout.getAttribute('aria-hidden') === 'false') { navDropdownAbout.setAttribute('aria-hidden','true'); navMenuToggleAbout.setAttribute('aria-expanded','false'); }
        safeCloseDialog(modeDialog); safeCloseDialog(historyDialog); safeCloseDialog(quickWinsDialog); clearDialogSelections();
      }
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
    if (header) header.style.borderLeft = `8px solid ${m.color || '#00AFA0'}`;

    if (dialogQuickWins) {
      const q = quickWinsMap[m.id] || [];
      dialogQuickWins.innerHTML = q.map(w => `
        <li>
          <div class="activity-row">
            <div style="max-width:68%">${escapeHtml(w.text)}<div class="activity-instruction">${escapeHtml(w.hint)}</div></div>
            <div>
              <button class="select-activity" data-activity="${escapeHtml(w.text)}">Select</button>
            </div>
          </div>
          <textarea class="activity-note" data-activity="${escapeHtml(w.text)}" placeholder="Notes (optional)" hidden></textarea>
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
          return `<div class="stat-card" style="border-left:8px solid ${m.color};"><div class="stat-value">${c}</div><div class="stat-label">${escapeHtml(m.name)} • ${pct}%</div></div>`;
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

  // arrow lerp using ARROW_MULTIPLIER
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