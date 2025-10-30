/* app.js v127 — CSS-only visual enhancements (no behavior changes)
   - ES5-friendly
   - Sets .app-root.theme-<mode> and renders mode pages with a header block so the theme is obvious
   - Keeps defensive event delegation and mode-specific confetti palettes
   - Removes debug click-trace UI (temporary)
*/

(function () {
  'use strict';

  /* Version marker */
  window.APP_VERSION = 'v127';

  /* Helpers */
  function $(sel, root) { root = root || document; try { return Array.prototype.slice.call(root.querySelectorAll(sel)); } catch (e) { return []; } }
  if (typeof window.$$ !== 'function') {
    window.$$ = function (sel, root) { root = root || document; try { return Array.prototype.slice.call(root.querySelectorAll(sel)); } catch (e) { return []; } };
  }
  function id(name) { return document.getElementById(name); }
  function escapeHtml(s) { s = String(s || ''); return s.replace(/[&<>"']/g, function (ch) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]); }); }
  function escapeJs(s) { s = String(s || ''); return s.replace(/'/g, "\\'").replace(/"/g, '\\"'); }

  /* Error capture */
  window.__lastAppError = null;
  window.onerror = function (msg, url, line, col, err) {
    try { window.__lastAppError = { msg: msg, url: url, line: line, col: col, err: err && (err.stack || err.message) || null, time: new Date().toISOString() }; } catch (e) {}
    return false;
  };

  /* Current mode & confetti palettes */
  window.__currentMode = '';
  var confettiColors = {
    growing: ['#79C7FF','#2FA0FF','#007BFF','#1B6EDC'],
    grounded: ['#B7E7C7','#7FD1A1','#2e8b57','#196035'],
    drifting: ['#FFE9A8','#FFD166','#D6A520','#B78F18'],
    surviving: ['#FFD3D6','#F08F91','#D9534F','#B73534'],
    quick: ['#E7E0FF','#C1B3FF','#6f42c1','#4b2a8a']
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

  /* Mode header icons (emoji) */
  var modeIcons = {
    growing: '🌱',
    grounded: '🌿',
    drifting: '🌤️',
    surviving: '🛟',
    'quick': '⚡'
  };

  /* Mode metadata & activities */
  var modeInfo = {
    growing: { title: 'Growing', desc: 'Push yourself to new heights — tackle meaningful tasks that expand capability and momentum.', tip: 'Pick one focused, slightly-challenging task you can make progress on in 15–30 minutes.' },
    grounded: { title: 'Grounded', desc: 'Stay centered and productive — structure your next steps and clear small hurdles.', tip: 'Break a larger task into 2–3 small wins and complete the first one now.' },
    drifting: { title: 'Drifting', desc: 'Gently regain focus and energy — calming movement, brief reflection, or a reset can help.', tip: 'Try a 7–10 minute walk or a 5-minute journaling exercise to refocus.' },
    surviving: { title: 'Surviving', desc: 'Just get through the day — prioritize essentials and basic self-care to stay afloat.', tip: 'Pick one low-effort, high-impact action (water, breathe, rest) and pause for 3–5 minutes.' }
  };

  var activities = {
    growing: [{ label: 'Write a goal', icon: '🎯' }, { label: 'Tackle a challenge', icon: '⚒️' }, { label: 'Start a new project', icon: '🚀' }],
    grounded: [{ label: 'Declutter a space', icon: '🧹' }, { label: 'Complete a task', icon: '✅' }, { label: 'Plan your day', icon: '🗓️' }],
    drifting: [{ label: 'Go for a walk', icon: '🚶' }, { label: 'Journal your thoughts', icon: '✍️' }, { label: 'Listen to calming music', icon: '🎧' }],
    surviving: [{ label: 'Drink water', icon: '💧' }, { label: 'Breathe deeply', icon: '🌬️' }, { label: 'Rest for 5 minutes', icon: '😴' }]
  };

  /* Ensure content area */
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

  /* Confetti */
  function runConfetti(mode) {
    try {
      mode = mode || window.__currentMode || 'quick';
      var colors = confettiColors[mode] || confettiColors['quick'];
      var n = 10, container = document.createElement('div');
      container.style.position = 'fixed'; container.style.left = '50%'; container.style.top = '32%';
      container.style.pointerEvents = 'none'; container.style.zIndex = 99999; container.style.transform = 'translateX(-50%)';
      document.body.appendChild(container);
      for (var i = 0; i < n; i++) {
        var dot = document.createElement('div'), size = (6 + Math.round(Math.random() * 8)) + 'px';
        dot.style.width = size; dot.style.height = size; dot.style.borderRadius = '50%';
        dot.style.background = colors[i % colors.length];
        dot.style.position = 'absolute'; dot.style.left = '0'; dot.style.top = '0'; dot.style.opacity = '0.95';
        container.appendChild(dot);
        (function (dot) {
          var angle = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 120, dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
          try { dot.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.9)', opacity: 0.9 }], { duration: 700 + Math.random() * 300 }); } catch (e) {}
        })(dot);
      }
      setTimeout(function () { try { container.remove(); } catch (e) {} }, 1400);
    } catch (e) { console.warn('confetti error', e); }
  }

  /* completeActivity (exposed) */
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

  /* Renderers that include a decorative header block */
  function renderHome() { var c = ensureContentElement(); c.innerHTML = ''; setTheme(''); }

  function renderModePage(mode) {
    var c = ensureContentElement(); setTheme(mode);
    var info = modeInfo[mode] || { title: mode, desc: '', tip: '' };
    if (!activities[mode]) { c.innerHTML = '<p>Unknown mode</p>'; return; }

    var icon = escapeHtml(modeIcons[mode] || '•');
    var html = '<div class="mode-page mode-' + escapeHtml(mode) + '" role="region" aria-labelledby="mode-title">';
    html += '<div class="mode-header"><div class="mode-icon" aria-hidden="true">' + icon + '</div>';
    html += '<div><h2 class="mode-title" id="mode-title">' + escapeHtml(info.title) + '</h2>';
    if (info.desc) html += '<div class="mode-sub">' + escapeHtml(info.desc) + '</div>';
    html += '</div></div>';
    if (info.tip) html += '<div class="mode-tip">Tip: ' + escapeHtml(info.tip) + '</div>';

    for (var i = 0; i < activities[mode].length; i++) {
      var act = activities[mode][i];
      html += '<div class="activity-row" id="row-' + mode + '-' + i + '">';
      html += '<div class="activity-main"><span class="activity-icon" aria-hidden="true">' + escapeHtml(act.icon) + '</span><div class="activity-label">' + escapeHtml(act.label) + '</div></div>';
      html += '<textarea id="note-' + mode + '-' + i + '" class="activity-note" placeholder="Notes (optional)"></textarea>';
      html += '<div class="activity-controls"><button class="btn-complete" onclick="completeActivity(\'' + mode + '\',\'' + escapeJs(act.label) + '\',\'note-' + mode + '-' + i + '\',\'row-' + mode + '-' + i + '\')">Complete</button></div>';
      html += '</div>';
    }

    html += '<button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button>';
    html += '</div>';
    c.innerHTML = html;
  }

  function renderQuickWins() {
    var c = ensureContentElement(); setTheme('quick');
    var quick = [{ label: 'Drink water', icon: '💧' }, { label: 'Stand up and stretch', icon: '🧘' }, { label: 'Take 3 deep breaths', icon: '🌬️' }];
    var html = '<div class="mode-page mode-quick"><div class="mode-header"><div class="mode-icon" aria-hidden="true">' + escapeHtml(modeIcons['quick']) + '</div>';
    html += '<div><h2 class="mode-title">Quick Wins</h2><div class="mode-sub">Small, fast actions to refresh your energy</div></div></div><div class="mode-tip">Quick actions to reset in 1–5 minutes</div>';
    html += '<div class="quick-list">';
    for (var i = 0; i < quick.length; i++) {
      html += '<div class="quick-card" id="qw-' + i + '">';
      html += '<div class="icon">' + escapeHtml(quick[i].icon) + '</div>';
      html += '<div class="content"><div class="label">' + escapeHtml(quick[i].label) + '</div>';
      html += '<textarea id="qw-note-' + i + '" class="activity-note" placeholder="Notes (optional)"></textarea>';
      html += '<div class="controls" style="margin-top:8px"><button class="btn-complete" onclick="completeActivity(\'quick-win\',\'' + escapeJs(quick[i].label) + '\',\'qw-note-' + i + '\',\'row-quick-' + i + '\')">Complete</button></div></div></div>';
    }
    html += '</div><button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button></div>';
    c.innerHTML = html;
  }

  function renderHistory() {
    var c = ensureContentElement(); setTheme('');
    var history = JSON.parse(localStorage.getItem('resetHistory') || '[]');
    var listHtml = '';
    if (history.length === 0) listHtml = '<p>No history yet.</p>'; else for (var i = 0; i < history.length; i++) listHtml += '<p><strong>' + escapeHtml(history[i].date) + ':</strong> ' + escapeHtml((history[i].mode || '').charAt(0).toUpperCase() + (history[i].mode || '').slice(1)) + ' — ' + escapeHtml(history[i].activity) + (history[i].note ? ' • <em>' + escapeHtml(history[i].note) + '</em>' : '') + '</p>';
    c.innerHTML = '<div class="mode-page"><h2>History</h2><div>' + listHtml + '</div><button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button></div>';
    // Chart code left unchanged (if Chart is present elsewhere)
  }

  function renderAbout() { var c = ensureContentElement(); setTheme(''); c.innerHTML = '<div class="mode-page"><h2>About</h2><p>The Reset Compass helps align energy and action with your state. Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p><button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button></div>'; }

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

  /* Defensive early delegation (capture) to ensure taps are handled reliably */
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

  /* bindUI + compass delegation + needle spin */
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
        var path = (tgt && tgt.closest) ? tgt.closest('[data-mode]') : null;
        if (!path) return;
        var mode = path.getAttribute('data-mode');
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
      console.info('[app v127] initialized (CSS-only visual enhancements)');
    } catch (err) {
      console.error('init failed', err);
      try { window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() }; } catch (e) {}
      var rt = id('app-root') || document.body; if (rt) { rt.classList.add('visible'); rt.setAttribute('aria-hidden', 'false'); }
    }
  });

})();