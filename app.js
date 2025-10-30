/* app.js (v128) — stable app + feature-flagged guided sessions (no animations)
   - APP_VERSION = 'v128'
   - window.__features.sessions controls guided sessions (true = enabled)
   - Session logic is isolated and uses localStorage for persistence
   - Non-animated confetti used for completion
*/

(function () {
  'use strict';

  window.APP_VERSION = window.APP_VERSION || 'v128';
  window.__features = window.__features || {};
  // Default: enable sessions on this branch. Set false to disable immediately:
  window.__features.sessions = (typeof window.__features.sessions === 'boolean') ? window.__features.sessions : true;

  /* Helpers (kept small and defensive) */
  function $(sel, root) { root = root || document; try { return Array.prototype.slice.call(root.querySelectorAll(sel)); } catch (e) { return []; } }
  if (typeof window.$$ !== 'function') {
    window.$$ = function (sel, root) { root = root || document; try { return Array.prototype.slice.call(root.querySelectorAll(sel)); } catch (e) { return []; } };
  }
  function id(name) { return document.getElementById(name); }
  function escapeHtml(s) { s = String(s || ''); return s.replace(/[&<>"']/g, function (ch) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]); }); }

  /* Error capture */
  window.__lastAppError = null;
  window.onerror = function (msg, url, line, col, err) {
    try { window.__lastAppError = { msg: msg, url: url, line: line, col: col, err: err && (err.stack || err.message) || null, time: new Date().toISOString() }; } catch (e) {}
    return false;
  };

  /* Current mode + palettes */
  window.__currentMode = '';
  var confettiColors = {
    growing: ['#79C7FF','#2FA0FF','#007BFF'],
    grounded: ['#B7E7C7','#7FD1A1','#2e8b57'],
    drifting: ['#FFE9A8','#FFD166','#D6A520'],
    surviving: ['#FFD3D6','#F08F91','#D9534F'],
    quick: ['#E7E0FF','#C1B3FF','#6f42c1']
  };

  function setTheme(mode) {
    try {
      var root = id('app-root'); if (!root) return;
      root.classList.remove('theme-growing','theme-grounded','theme-drifting','theme-surviving','theme-quick');
      if (mode) root.classList.add('theme-' + mode);
      window.__currentMode = mode || '';
    } catch (e) { console.warn('setTheme failed', e); }
  }
  window.setTheme = setTheme;

  /* Mode data */
  var modeIcons = { growing: '🌱', grounded: '🌿', drifting: '🌤️', surviving: '🛟', quick: '⚡' };
  var modeInfo = {
    growing: { title: 'Growing', desc: 'Push yourself to new heights — tackle meaningful tasks that expand capability and momentum.', tip: 'Try a focused 25-minute work session (Pomodoro).' },
    grounded: { title: 'Grounded', desc: 'Stay centered and productive — structure your next steps and clear small hurdles.', tip: 'Break a larger task into 2–3 small wins and do the first now.' },
    drifting: { title: 'Drifting', desc: 'Gently regain focus and energy — calming movement, brief reflection, or a reset can help.', tip: 'Try a 7–10 minute walk or a 5-minute breathing reset.' },
    surviving: { title: 'Surviving', desc: 'Just get through the day — prioritize essentials and basic self-care to stay afloat.', tip: 'Take a 3–5 minute breathing break (box or 4-4-4) and hydrate.' }
  };
  var activities = {
    growing: [{ label: 'Write a goal', icon: '🎯' }, { label: 'Tackle a challenge', icon: '⚒️' }, { label: 'Start a new project', icon: '🚀' }],
    grounded: [{ label: 'Declutter a space', icon: '🧹' }, { label: 'Complete a task', icon: '✅' }, { label: 'Plan your day', icon: '🗓️' }],
    drifting: [{ label: 'Go for a walk', icon: '🚶' }, { label: 'Journal your thoughts', icon: '✍️' }, { label: 'Listen to calming music', icon: '🎧' }],
    surviving: [{ label: 'Drink water', icon: '💧' }, { label: 'Breathe deeply', icon: '🌬️' }, { label: 'Rest for 5 minutes', icon: '😴' }]
  };

  /* Ensure content container */
  function ensureContentElement() {
    var c = id('content');
    if (c) return c;
    var page = id('page') || document.querySelector('.page') || document.body;
    c = document.createElement('div');
    c.id = 'content';
    c.className = 'content-area';
    c.setAttribute('aria-live', 'polite');
    page.appendChild(c);
    return c;
  }

  /* Non-animated confetti (safe) */
  function runConfetti(mode) {
    try {
      mode = mode || window.__currentMode || 'quick';
      var colors = confettiColors[mode] || confettiColors['quick'];
      var n = 10, container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '50%';
      container.style.top = '32%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = 99999;
      container.style.transform = 'translateX(-50%)';
      document.body.appendChild(container);

      for (var i = 0; i < n; i++) {
        var dot = document.createElement('div');
        var size = (6 + Math.round(Math.random() * 8)) + 'px';
        dot.style.width = size;
        dot.style.height = size;
        dot.style.borderRadius = '50%';
        dot.style.background = colors[i % colors.length];
        dot.style.margin = (Math.random() * 12) + 'px';
        container.appendChild(dot);
      }

      setTimeout(function () { try { container.remove(); } catch (e) {} }, 900);
    } catch (e) { console.warn('confetti error', e); }
  }

  /* completeActivity (unchanged behavior) */
  window.completeActivity = function (mode, activity, noteId, rowId) {
    try {
      var row = id(rowId);
      if (row) { try { row.classList.add('activity-complete-pop'); } catch (e) {} }
      var noteElem = document.getElementById(noteId);
      var note = noteElem ? noteElem.value : '';
      var date = new Date().toLocaleDateString();
      var normalized = (mode === 'quick' || mode === 'quick-win') ? 'quick-win' : mode;
      var entry = { date: date, mode: normalized, activity: activity, note: note };
      var hist = JSON.parse(localStorage.getItem('resetHistory') || '[]');
      hist.unshift(entry);
      localStorage.setItem('resetHistory', JSON.stringify(hist));
      var lastLogged = localStorage.getItem('lastLogged');
      var today = new Date().toLocaleDateString();
      if (lastLogged !== today) {
        var streak = parseInt(localStorage.getItem('streak') || '0', 10) || 0;
        streak += 1;
        localStorage.setItem('streak', String(streak));
        localStorage.setItem('lastLogged', today);
        updateStreak();
      }
      try { runConfetti(window.__currentMode || normalized); } catch (e) {}
      setTimeout(function () { navigateHash('#history'); }, 700);
    } catch (e) { console.error('completeActivity error', e); window.__lastAppError = { msg: e.message || String(e), stack: e.stack || null, time: new Date().toISOString() }; }
  };

  function updateStreak() { var el = id('streak-count'); if (el) el.textContent = localStorage.getItem('streak') || '0'; }

  /* Navigation helpers */
  window.navigateHash = function (hash) {
    try { location.hash = hash; } catch (e) { console.warn(e); }
    try { if (typeof window.renderRoute === 'function') window.renderRoute(); } catch (e) {}
  };
  window.navigateMode = function (mode) {
    try { location.hash = '#mode/' + mode; } catch (e) { console.warn(e); }
    try { if (typeof window.renderRoute === 'function') window.renderRoute(); } catch (e) {}
  };

  /* Renderers (mode pages include Start session CTA when sessions enabled) */
  function renderHome() { var c = ensureContentElement(); c.innerHTML = ''; setTheme(''); }

  function renderModePage(mode) {
    var c = ensureContentElement(); setTheme(mode);
    var info = modeInfo[mode] || { title: mode, desc: '', tip: '' };
    if (!activities[mode]) { c.innerHTML = '<p>Unknown mode</p>'; return; }

    var icon = escapeHtml(modeIcons[mode] || '•');
    var html = '<div class="mode-page mode-' + escapeHtml(mode) + '" role="region" aria-labelledby="mode-title">';
    html += '<div class="mode-header"><div class="mode-icon" aria-hidden="true">' + icon + '</div>';
    html += '<div><h2 class="mode-title" id="mode-title">' + escapeHtml(info.title) + '</h2>';
    if (info.desc) html += '<div class="mode-desc">' + escapeHtml(info.desc) + '</div>';
    html += '</div></div>';
    if (info.tip) html += '<div class="mode-tip">Tip: ' + escapeHtml(info.tip) + '</div>';

    // Start session CTA (if enabled)
    if (window.__features && window.__features.sessions) {
      html += '<div class="session-cta" style="margin:12px 0;"><button class="btn-primary" data-start-session data-mode="' + escapeHtml(mode) + '">Start session</button></div>';
    }

    // Activities
    for (var i = 0; i < activities[mode].length; i++) {
      var act = activities[mode][i];
      html += '<div class="activity-row" id="row-' + mode + '-' + i + '">';
      html += '<div class="activity-main"><span class="activity-icon" aria-hidden="true">' + escapeHtml(act.icon) + '</span><div class="activity-label">' + escapeHtml(act.label) + '</div></div>';
      html += '<textarea id="note-' + mode + '-' + i + '" class="activity-note" placeholder="Notes (optional)"></textarea>';
      html += '<div class="activity-controls"><button class="btn-complete" onclick="completeActivity(\\'' + mode + '\\',\\'' + escapeHtml(act.label) + '\\',\\'note-' + mode + '-' + i + '\\',\\'row-' + mode + '-' + i + '\\')">Complete</button></div>';
      html += '</div>';
    }

    html += '<button class="return-button" onclick="navigateHash(\\'#home\\')">Return to the Compass</button>';
    html += '</div>';
    c.innerHTML = html;

    // attach Start session handlers for the buttons just rendered
    var starts = c.querySelectorAll('[data-start-session]');
    for (var j = 0; j < starts.length; j++) {
      (function (btn) {
        if (!btn.__bound) {
          btn.addEventListener('click', function (e) {
            var md = btn.getAttribute('data-mode') || mode;
            try { window.openSession && window.openSession(md); } catch (e) {}
          });
          btn.__bound = true;
        }
      })(starts[j]);
    }
  }

  function renderQuickWins() {
    var c = ensureContentElement(); setTheme('quick');
    var quick = [{ label: 'Drink water', icon: '💧' }, { label: 'Stand up and stretch', icon: '🧘' }, { label: 'Take 3 deep breaths', icon: '🌬️' }];
    var html = '<div class="mode-page mode-quick"><div class="mode-header"><div class="mode-icon" aria-hidden="true">' + escapeHtml(modeIcons['quick']) + '</div>';
    html += '<div><h2 class="mode-title">Quick Wins</h2><div class="mode-desc">Small, fast actions to refresh your energy</div></div></div><div class="mode-tip">Quick actions to reset in 1–5 minutes</div>';

    // Start session CTA for quick wins (if enabled)
    if (window.__features && window.__features.sessions) {
      html += '<div class="session-cta" style="margin:12px 0;"><button class="btn-primary" data-start-session data-mode="quick">Start session</button></div>';
    }

    html += '<div class="quick-list">';
    for (var i = 0; i < quick.length; i++) {
      html += '<div class="quick-card" id="qw-' + i + '">';
      html += '<div class="icon">' + escapeHtml(quick[i].icon) + '</div>';
      html += '<div class="content"><div class="label">' + escapeHtml(quick[i].label) + '</div>';
      html += '<textarea id="qw-note-' + i + '" class="activity-note" placeholder="Notes (optional)"></textarea>';
      html += '<div class="controls" style="margin-top:8px"><button class="btn-complete" onclick="completeActivity(\\'quick-win\\',\\'' + escapeHtml(quick[i].label) + '\\',\\'qw-note-' + i + '\\',\\'row-quick-' + i + '\\')">Complete</button></div></div></div>';
    }
    html += '</div><button class="return-button" onclick="navigateHash(\\'#home\\')">Return to the Compass</button></div>';
    c.innerHTML = html;

    var starts = c.querySelectorAll('[data-start-session]');
    for (var j = 0; j < starts.length; j++) {
      (function (btn) {
        if (!btn.__bound) {
          btn.addEventListener('click', function () { try { window.openSession && window.openSession('quick'); } catch (e) {} });
          btn.__bound = true;
        }
      })(starts[j]);
    }
  }

  function renderHistory() {
    var c = ensureContentElement(); setTheme('');
    var history = JSON.parse(localStorage.getItem('resetHistory') || '[]');
    var listHtml = '';
    if (history.length === 0) listHtml = '<p>No history yet.</p>'; else for (var i = 0; i < history.length; i++) listHtml += '<p><strong>' + escapeHtml(history[i].date) + ':</strong> ' + escapeHtml((history[i].mode || '').charAt(0).toUpperCase() + (history[i].mode || '').slice(1)) + ' — ' + escapeHtml(history[i].activity) + (history[i].note ? ' • <em>' + escapeHtml(history[i].note) + '</em>' : '') + '</p>';
    c.innerHTML = '<div class="mode-page"><h2>History</h2><div>' + listHtml + '</div><button class="return-button" onclick="navigateHash(\\'#home\\')">Return to the Compass</button></div>';
  }

  function renderAbout() { var c = ensureContentElement(); setTheme(''); c.innerHTML = '<div class="mode-page"><h2>About</h2><p>The Reset Compass helps align energy and action with your state. Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p><button class="return-button" onclick="navigateHash(\\'#home\\')">Return to the Compass</button></div>'; }

  /* renderRoute */  
  function renderRoute() {
    try {
      var h = location.hash || '#home';
      var isFull = h !== '#home';
      var compassContainer = id('compass-container'), modeButtons = id('mode-buttons'), howTo = id('how-to');
      if (compassContainer) compassContainer.style.display = isFull ? 'none' : '';
      if (modeButtons) modeButtons.style.display = isFull ? 'none' : '';
      if (howTo) howTo.style.display = isFull ? 'none' : '';
      if (h.indexOf('#mode/') === 0) { var m = h.split('/')[1]; setTheme(m); renderModePage(m); }
      else if (h === '#quick') { setTheme('quick'); renderQuickWins(); }
      else if (h === '#history') { setTheme(''); renderHistory(); }
      else if (h === '#about') { setTheme(''); renderAbout(); }
      else { setTheme(''); renderHome(); }
      try { window.scrollTo(0, 0); } catch (e) {}
    } catch (e) { console.error('renderRoute failed', e); window.__lastAppError = { msg: e.message || String(e), stack: e.stack || null, time: new Date().toISOString() }; }
  }
  window.renderRoute = renderRoute;

  /* Session implementation (feature-flagged) */
  var sessionDefaults = {
    growing: 25 * 60,
    grounded: 15 * 60,
    drifting: 5 * 60,
    surviving: 3 * 60,
    quick: 1 * 60
  };

  var sessionState = { timerId: null, remaining: 0, mode: null, running: false };

  function persistSession() {
    try {
      if (!sessionState.mode) return;
      var key = 'session.' + sessionState.mode;
      var obj = { remaining: sessionState.remaining, mode: sessionState.mode, running: sessionState.running, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {}
  }

  function restoreSessionForMode(mode) {
    try {
      var key = 'session.' + mode;
      var raw = localStorage.getItem(key);
      if (!raw) return false;
      var obj = JSON.parse(raw);
      if (!obj || obj.mode !== mode) return false;
      sessionState.mode = mode;
      sessionState.remaining = typeof obj.remaining === 'number' ? obj.remaining : sessionDefaults[mode] || 60;
      sessionState.running = !!obj.running;
      return true;
    } catch (e) { return false; }
  }

  function clearPersistedSession(mode) {
    try { localStorage.removeItem('session.' + (mode || sessionState.mode || 'none')); } catch (e) {}
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  function startTimer(seconds, onDone) {
    try {
      stopTimer();
      sessionState.remaining = seconds || 60;
      sessionState.running = true;
      persistSession();
      var display = id('session-timer');
      if (display) display.textContent = formatTime(sessionState.remaining);
      sessionState.timerId = setInterval(function () {
        sessionState.remaining -= 1;
        if (display) display.textContent = formatTime(sessionState.remaining);
        persistSession();
        if (sessionState.remaining <= 0) {
          stopTimer();
          sessionState.running = false;
          clearPersistedSession(sessionState.mode);
          if (typeof onDone === 'function') onDone();
        }
      }, 1000);
    } catch (e) { console.warn('startTimer failed', e); }
  }

  function stopTimer() {
    if (sessionState.timerId) { clearInterval(sessionState.timerId); sessionState.timerId = null; sessionState.running = false; }
    persistSession();
  }

  function pushGuidedSessionHistory(mode) {
    try {
      var date = new Date().toLocaleDateString();
      var entry = { date: date, mode: mode, activity: 'Guided session complete', note: '' };
      var hist = JSON.parse(localStorage.getItem('resetHistory') || '[]');
      hist.unshift(entry);
      localStorage.setItem('resetHistory', JSON.stringify(hist));
      var lastLogged = localStorage.getItem('lastLogged');
      var today = new Date().toLocaleDateString();
      if (lastLogged !== today) {
        var streak = parseInt(localStorage.getItem('streak') || '0', 10) || 0;
        streak += 1;
        localStorage.setItem('streak', String(streak));
        localStorage.setItem('lastLogged', today);
        updateStreak();
      }
    } catch (e) {}
  }

  function buildSessionBody(mode) {
    var html = '';
    html += '<p class="helper">Follow the short guided session below. You can start, pause, and resume. Progress persists if you close the modal.</p>';
    html += '<div class="timer"><div class="timer-display" id="session-timer">' + formatTime(sessionDefaults[mode] || 60) + '</div><div class="helper">Recommended</div></div>';
    html += '<div class="step-list">';
    if (mode === 'growing') {
      html += '<div class="step-item"><input type="checkbox" id="step-1"><label for="step-1">Set a clear goal (2 min)</label></div>';
      html += '<div class="step-item"><input type="checkbox" id="step-2"><label for="step-2">Work focused (25 min)</label></div>';
      html += '<div class="step-item"><input type="checkbox" id="step-3"><label for="step-3">Quick review (3 min)</label></div>';
    } else if (mode === 'grounded') {
      html += '<div class="step-item"><input type="checkbox" id="step-1"><label for="step-1">Pick one area to declutter (5–15 min)</label></div>';
      html += '<div class="step-item"><input type="checkbox" id="step-2"><label for="step-2">Complete a small task (10–20 min)</label></div>';
      html += '<div class="step-item"><input type="checkbox" id="step-3"><label for="step-3">Plan next 3 actions</label></div>';
    } else if (mode === 'drifting') {
      html += '<div class="step-item"><input type="checkbox" id="step-1"><label for="step-1">Step outside or move gently (7–10 min)</label></div>';
      html += '<div class="step-item"><input type="checkbox" id="step-2"><label for="step-2">Breathe or journal (5 min)</label></div>';
    } else if (mode === 'surviving') {
      html += '<div class="step-item"><input type="checkbox" id="step-1"><label for="step-1">Drink a glass of water</label></div>';
      html += '<div class="step-item"><input type="checkbox" id="step-2"><label for="step-2">Breathe for 3–5 minutes</label></div>';
      html += '<div class="step-item"><input type="checkbox" id="step-3"><label for="step-3">Sit quietly for a minute</label></div>';
    } else {
      html += '<div class="step-item"><input type="checkbox" id="step-1"><label for="step-1">Drink water</label></div>';
      html += '<div class="step-item"><input type="checkbox" id="step-2"><label for="step-2">Stretch</label></div>';
    }
    html += '</div>';
    return html;
  }

  function openSession(mode) {
    try {
      if (!window.__features.sessions) return;
      var modal = id('session-modal'), body = id('session-body'), title = id('session-title');
      if (!modal || !body || !title) return;
      title.textContent = (mode.charAt(0).toUpperCase() + mode.slice(1)) + ' — Guided session';
      body.innerHTML = buildSessionBody(mode);
      modal.hidden = false;
      // restore persisted session if present
      if (restoreSessionForMode(mode)) {
        var display = id('session-timer'); if (display) display.textContent = formatTime(sessionState.remaining);
      } else {
        sessionState.mode = mode;
        sessionState.remaining = sessionDefaults[mode] || 60;
        sessionState.running = false;
        var display = id('session-timer'); if (display) display.textContent = formatTime(sessionState.remaining);
      }
      createSessionBindings(mode);
      var panel = modal.querySelector('.modal-panel'); if (panel) panel.focus && panel.setAttribute('tabindex', '-1');

      // restore checklist state if any (small delay to ensure DOM ready)
      setTimeout(function () {
        try {
          var raw = localStorage.getItem('session.checklist.' + (mode || 'session'));
          if (!raw) return;
          var arr = JSON.parse(raw);
          var checks = modal.querySelectorAll('.step-item input[type="checkbox"]');
          for (var i = 0; i < checks.length && i < arr.length; i++) checks[i].checked = !!arr[i];
        } catch (e) {}
      }, 120);
    } catch (e) { console.warn('openSession error', e); }
  }

  function closeSession() {
    try {
      var modal = id('session-modal'); if (!modal) return;
      modal.hidden = true;
      stopTimer();
    } catch (e) {}
  }

  function createSessionBindings(mode) {
    try {
      var modal = id('session-modal');
      if (!modal) return;
      var start = id('session-start'), cancel = id('session-cancel'), closeBtn = id('session-close');
      if (start && modal._startFn) start.removeEventListener('click', modal._startFn);
      if (cancel && modal._cancelFn) cancel.removeEventListener('click', modal._cancelFn);
      if (closeBtn && modal._closeFn) closeBtn.removeEventListener('click', modal._closeFn);
      if (modal._keyHandler) document.removeEventListener('keydown', modal._keyHandler);

      modal._startFn = function () {
        sessionState.mode = mode;
        startTimer(sessionDefaults[mode] || 60, function () {
          pushGuidedSessionHistory(mode);
          runConfetti(mode);
          setTimeout(closeSession, 600);
        });
      };
      modal._cancelFn = function () { closeSession(); };
      modal._closeFn = function () { closeSession(); };
      modal._keyHandler = function (e) { if (e.key === 'Escape') closeSession(); };

      start && start.addEventListener('click', modal._startFn);
      cancel && cancel.addEventListener('click', modal._cancelFn);
      closeBtn && closeBtn.addEventListener('click', modal._closeFn);
      document.addEventListener('keydown', modal._keyHandler);

      // clicking backdrop closes
      modal.addEventListener('click', function (e) { if (e.target === modal) closeSession(); });
    } catch (e) { console.warn('createSessionBindings', e); }
  }

  // Expose minimal API
  window.openSession = openSession;
  window.closeSession = closeSession;

  // Ensure session CTAs are attached after route renders (non-invasive)
  var _origRenderRoute = window.renderRoute;
  if (typeof _origRenderRoute === 'function') {
    window.renderRoute = function () {
      try { _origRenderRoute(); } catch (e) {}
      try {
        var h = location.hash || '#home';
        if (h.indexOf('#mode/') === 0) {
          var mode = h.split('/')[1];
          // append CTA if sessions enabled (renderModePage will also add in many cases)
          var content = id('content'); if (content) {
            var mp = content.querySelector('.mode-page');
            if (mp && !mp.querySelector('[data-start-session]') && window.__features.sessions) {
              var wrapper = document.createElement('div'); wrapper.style.margin = '12px 0';
              var btn = document.createElement('button'); btn.className = 'btn-primary'; btn.setAttribute('data-start-session', 'true'); btn.setAttribute('data-mode', mode); btn.textContent = 'Start session';
              wrapper.appendChild(btn); mp.insertBefore(wrapper, mp.firstChild ? mp.firstChild.nextSibling : null);
              btn.addEventListener('click', function () { openSession(mode); });
            }
          }
        } else if (h === '#quick') {
          var content = id('content'); if (content) {
            var mp = content.querySelector('.mode-page');
            if (mp && !mp.querySelector('[data-start-session]') && window.__features.sessions) {
              var wrapper = document.createElement('div'); wrapper.style.margin = '12px 0';
              var btn = document.createElement('button'); btn.className = 'btn-primary'; btn.setAttribute('data-start-session', 'true'); btn.setAttribute('data-mode', 'quick'); btn.textContent = 'Start session';
              wrapper.appendChild(btn); mp.insertBefore(wrapper, mp.firstChild ? mp.firstChild.nextSibling : null);
              btn.addEventListener('click', function () { openSession('quick'); });
            }
          }
        }
      } catch (e) { console.warn('renderRoute wrapper', e); }
    };
  }

  /* Defensive early delegation */
  (function attachEarlyDelegate() {
    try {
      function safeNavigateHash(h) {
        try {
          if (typeof window.navigateHash === 'function') { window.navigateHash(h); return; }
          location.hash = h;
          if (typeof window.renderRoute === 'function') window.renderRoute();
        } catch (e) {}
      }
      function safeNavigateMode(m) {
        try {
          if (typeof window.navigateMode === 'function') { window.navigateMode(m); return; }
          location.hash = '#mode/' + m;
          if (typeof window.renderRoute === 'function') window.renderRoute();
        } catch (e) {}
      }

      document.addEventListener('click', function (ev) {
        try {
          var tgt = ev.target;
          var a = tgt && tgt.closest ? tgt.closest('.nav-links a[data-hash]') : null;
          if (a) { try { ev.preventDefault && ev.preventDefault(); } catch (e) {} var hh = a.getAttribute('data-hash') || a.getAttribute('href') || '#home'; safeNavigateHash(hh); return; }

          var b = tgt && tgt.closest ? tgt.closest('button[data-mode]') : null;
          if (b) { try { ev.preventDefault && ev.preventDefault(); } catch (e) {} var mm = b.getAttribute('data-mode'); try { setTheme(mm); } catch (e) {} safeNavigateMode(mm); return; }

          var svgNode = tgt && tgt.closest ? tgt.closest('[data-mode]') : null;
          if (svgNode) {
            var md = svgNode.getAttribute && svgNode.getAttribute('data-mode');
            if (md) { try { ev.preventDefault && ev.preventDefault(); } catch (e) {} try { setTheme(md); } catch (e) {} safeNavigateMode(md); return; }
          }
        } catch (err) {}
      }, true);
    } catch (e) {}
  })();

  /* UI bindings */
  function bindUI() {
    try {
      var navs = $$('.nav-links a[data-hash]');
      for (var n = 0; n < navs.length; n++) {
        (function (a) {
          if (!a.__bound) {
            a.addEventListener('click', function (e) { try { e && e.preventDefault && e.preventDefault(); } catch (ee) {} var h = a.getAttribute('data-hash') || a.getAttribute('href'); navigateHash(h); });
            a.__bound = true;
          }
        })(navs[n]);
      }
      var btns = $$('button[data-mode]');
      for (var b = 0; b < btns.length; b++) {
        (function (el) {
          if (!el.__bound) {
            el.addEventListener('click', function (ev) { try { ev && ev.preventDefault && ev.preventDefault(); } catch (ee) {} var m = el.getAttribute('data-mode'); setTheme(m); renderModePage(m); navigateMode(m); });
            el.__bound = true;
          }
        })(btns[b]);
      }
    } catch (e) { console.warn('bindUI error', e); }
  }

  function attachCompassDelegation() {
    var comp = id('compass'); if (!comp) return; if (comp.__delegated) return;
    comp.addEventListener('click', function (ev) {
      try {
        var tgt = ev.target;
        var node = (tgt && tgt.closest) ? tgt.closest('[data-mode]') : null;
        if (!node) return;
        var mode = node.getAttribute('data-mode');
        setTheme(mode);
        renderModePage(mode);
        navigateMode(mode);
      } catch (e) { console.warn('compass click', e); }
    });
    comp.__delegated = true;
  }

  function setupNeedleSpin() {
    var ng = id('needle-group');
    if (!ng) return;
    var ANG = 720, lastY = 0, queued = false;
    function onScroll() {
      lastY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      if (!queued) {
        queued = true;
        window.requestAnimationFrame(function () {
          queued = false;
          var doc = document.documentElement;
          var max = Math.max(1, doc.scrollHeight - window.innerHeight);
          var r = Math.max(0, Math.min(1, lastY / max));
          try { ng.style.transform = 'rotate(' + (r * ANG) + 'deg)'; } catch (e) {}
        });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  window.__rebindUI = function () { try { bindUI(); attachCompassDelegation(); setupNeedleSpin(); console.info('rebindUI done'); } catch (e) { console.warn('rebindUI failed', e); } };

  /* Modal checklist tap helper (defensive) */
  (function () {
    function modalChecklistDelegate(e) {
      try {
        var modal = document.getElementById('session-modal');
        if (!modal || modal.hidden) return;
        var tgt = e.target;
        // find nearest .step-item
        var row = tgt && tgt.closest ? tgt.closest('.step-item') : null;
        if (!row) return;
        // if the click was on the checkbox itself, let native behavior happen
        var cb = row.querySelector('input[type="checkbox"]');
        if (!cb) return;
        if (e.target === cb) return;
        // otherwise toggle checkbox
        e.preventDefault && e.preventDefault();
        cb.checked = !cb.checked;
        // persist per-session checklist to localStorage (keyed by mode)
        try {
          var modeTitle = document.getElementById('session-title');
          var mode = modeTitle ? (modeTitle.textContent || '').split('—')[0].trim().toLowerCase() : 'session';
          var list = Array.prototype.slice.call(modal.querySelectorAll('.step-item input[type="checkbox"]')).map(function(chk){ return chk.checked; });
          localStorage.setItem('session.checklist.' + mode, JSON.stringify(list));
        } catch (err) {}
      } catch (err) { /* swallow */ }
    }
    document.addEventListener('click', modalChecklistDelegate, true);
  })();

  /* Init */
  document.addEventListener('DOMContentLoaded', function () {
    try {
      var root = id('app-root'); if (root) { root.classList.add('visible'); root.setAttribute('aria-hidden', 'false'); }
      ensureContentElement();
      bindUI();
      attachCompassDelegation();
      setupNeedleSpin();
      if (!location.hash) location.hash = '#home';
      renderRoute();
      updateStreak();
      console.info('[app v128] initialized (sessions feature: ' + (window.__features.sessions ? 'enabled' : 'disabled') + ')');
    } catch (err) {
      console.error('init failed', err);
      try { window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() }; } catch (e) {}
      var rt = id('app-root') || document.body; if (rt) { rt.classList.add('visible'); rt.setAttribute('aria-hidden', 'false'); }
    }
  });

})();