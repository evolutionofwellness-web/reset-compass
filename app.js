/* app.js v117 — simplified, ES5-friendly, single-file core
   - Purpose: provide a compact, readable, robust main JS that works across browsers (including iOS WebKit)
   - Approach: single initialization path, delegated event handlers, minimal defensive retries,
               simple scroll-driven needle rotation, and the same renderers for views and activities.
   - Paste/replace this file as app.js and hard-refresh (Cmd/Ctrl+Shift+R) or open a Private tab to test.
*/

(function () {
  'use strict';

  /* --- Small utilities --- */
  function $(sel, root) { root = root || document; return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function id(name) { return document.getElementById(name); }
  function escapeHtml(s) {
    s = String(s || '');
    return s.replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]);
    });
  }
  function escapeJs(s) { s = String(s || ''); return s.replace(/'/g, "\\'").replace(/"/g, '\\"'); }

  /* --- Diagnostic capture (keeps last error) --- */
  window.__lastAppError = null;
  window.onerror = function (msg, url, line, col, err) {
    try { window.__lastAppError = { msg: msg, url: url, line: line, col: col, err: err && (err.stack || err.message) || null, time: new Date().toISOString() }; } catch (e) {}
    return false;
  };

  /* --- Ensure content area exists --- */
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

  /* --- Navigation helpers exposed globally for debugging --- */
  window.navigateHash = function (hash) {
    try { location.hash = hash; } catch (e) { console.warn(e); }
    try { if (typeof window.renderRoute === 'function') window.renderRoute(); } catch (e) {}
  };
  window.navigateMode = function (mode) {
    try { location.hash = '#mode/' + mode; } catch (e) { console.warn(e); }
    try { if (typeof window.renderRoute === 'function') window.renderRoute(); } catch (e) {}
  };

  /* --- Activity dataset --- */
  var activities = {
    growing: [{ label: 'Write a goal', icon: '🎯' }, { label: 'Tackle a challenge', icon: '⚒️' }, { label: 'Start a new project', icon: '🚀' }],
    grounded: [{ label: 'Declutter a space', icon: '🧹' }, { label: 'Complete a task', icon: '✅' }, { label: 'Plan your day', icon: '🗓️' }],
    drifting: [{ label: 'Go for a walk', icon: '🚶' }, { label: 'Journal your thoughts', icon: '✍️' }, { label: 'Listen to calming music', icon: '🎧' }],
    surviving: [{ label: 'Drink water', icon: '💧' }, { label: 'Breathe deeply', icon: '🌬️' }, { label: 'Rest for 5 minutes', icon: '😴' }]
  };

  /* --- Simple theme setter (non-invasive) --- */
  function setTheme(mode) {
    try {
      var root = id('app-root');
      if (!root) return;
      root.classList.remove('theme-growing', 'theme-grounded', 'theme-drifting', 'theme-surviving');
      if (mode) root.classList.add('theme-' + mode);
      // small transient visual cue
      var flash = document.createElement('div');
      flash.className = 'mode-flash';
      flash.style.pointerEvents = 'none';
      flash.style.position = 'absolute';
      flash.style.inset = '0';
      flash.style.opacity = '0.06';
      flash.style.background = 'white';
      root.appendChild(flash);
      setTimeout(function () { try { root.removeChild(flash); } catch (e) {} }, 420);
    } catch (e) { /* ignore */ }
  }

  /* --- Renderers (compact and readable) --- */
  function renderRoute() {
    try {
      var h = location.hash || '#home';
      var isFull = h !== '#home';
      var compassContainer = id('compass-container');
      var modeButtons = id('mode-buttons');
      var howTo = id('how-to');
      if (compassContainer) compassContainer.style.display = isFull ? 'none' : '';
      if (modeButtons) modeButtons.style.display = isFull ? 'none' : '';
      if (howTo) howTo.style.display = isFull ? 'none' : '';
      if (h.indexOf('#mode/') === 0) {
        renderModePage(h.split('/')[1]);
      } else if (h === '#quick') {
        renderQuickWins();
      } else if (h === '#history') {
        renderHistory();
      } else if (h === '#about') {
        renderAbout();
      } else {
        renderHome();
      }
      try { window.scrollTo(0, 0); } catch (e) {}
    } catch (e) {
      console.error('renderRoute error', e);
      window.__lastAppError = { msg: e.message || String(e), stack: e.stack || null, time: new Date().toISOString() };
    }
  }
  window.renderRoute = renderRoute;

  function renderHome() { var c = ensureContentElement(); c.innerHTML = ''; setTheme(''); }
  function renderModePage(mode) {
    var c = ensureContentElement(); setTheme(mode);
    if (!activities[mode]) { c.innerHTML = '<p>Unknown mode</p>'; return; }
    var parts = ['<div class="mode-page" role="region" aria-labelledby="mode-title"><h2 id="mode-title">' + (mode.charAt(0).toUpperCase() + mode.slice(1)) + '</h2>'];
    for (var i = 0; i < activities[mode].length; i++) {
      var act = activities[mode][i];
      parts.push('<div class="activity-row" id="row-' + mode + '-' + i + '">');
      parts.push('<div class="activity-main"><span class="activity-icon" aria-hidden="true">' + escapeHtml(act.icon) + '</span><div class="activity-label">' + escapeHtml(act.label) + '</div></div>');
      parts.push('<textarea id="note-' + mode + '-' + i + '" class="activity-note" placeholder="Notes (optional)"></textarea>');
      parts.push('<div class="activity-controls"><button class="btn btn-complete" onclick="completeActivity(\'' + mode + '\',\'' + escapeJs(act.label) + '\',\'note-' + mode + '-' + i + '\',\'row-' + mode + '-' + i + '\')">Complete</button></div>');
      parts.push('</div>');
    }
    parts.push('<button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button></div>');
    c.innerHTML = parts.join('');
    // animate rows modestly
    var rows = c.querySelectorAll('.activity-row');
    for (i = 0; i < rows.length; i++) { rows[i].style.animation = 'fadeRow 420ms ease ' + (i * 40) + 'ms both'; }
  }

  function renderQuickWins() {
    var c = ensureContentElement();
    var quick = [{ label: 'Drink water', icon: '💧' }, { label: 'Stand up and stretch', icon: '🧘' }, { label: 'Take 3 deep breaths', icon: '🌬️' }];
    var parts = ['<div class="mode-page"><h2>Quick Wins</h2>'];
    for (var i = 0; i < quick.length; i++) {
      parts.push('<div class="activity-row" id="row-quick-' + i + '"><div class="activity-main"><span class="activity-icon">' + escapeHtml(quick[i].icon) + '</span><div class="activity-label">' + escapeHtml(quick[i].label) + '</div></div>');
      parts.push('<textarea id="qw-' + i + '" class="activity-note" placeholder="Notes (optional)"></textarea>');
      parts.push('<div class="activity-controls"><button class="btn btn-complete" onclick="completeActivity(\'quick-win\',\'' + escapeJs(quick[i].label) + '\',\'qw-' + i + '\',\'row-quick-' + i + '\')">Complete</button></div></div>');
    }
    parts.push('<button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button></div>');
    c.innerHTML = parts.join('');
  }

  function renderHistory() {
    var c = ensureContentElement();
    var history = JSON.parse(localStorage.getItem('resetHistory') || '[]');
    var counts = { growing: 0, grounded: 0, drifting: 0, surviving: 0, 'quick-win': 0 };
    for (var k = 0; k < history.length; k++) {
      var key = (history[k].mode || '').toLowerCase();
      if (typeof counts[key] !== 'undefined') counts[key] += 1;
    }
    var total = counts.growing + counts.grounded + counts.drifting + counts.surviving + counts['quick-win'];
    var statsHtml = total === 0 ? '<p>No entries yet. Complete an activity to build your stats.</p>' : '<div class="history-stats"><div class="history-chart-wrap"><canvas id="history-donut" aria-label="Mode distribution" role="img"></canvas></div></div>';
    var listHtml = '';
    if (history.length === 0) listHtml = '<p>No history yet.</p>';
    else {
      for (var i = 0; i < history.length; i++) {
        var h = history[i];
        listHtml += '<p><strong>' + escapeHtml(h.date) + ':</strong> ' + escapeHtml((h.mode || '').charAt(0).toUpperCase() + (h.mode || '').slice(1)) + ' — ' + escapeHtml(h.activity) + (h.note ? ' • <em>' + escapeHtml(h.note) + '</em>' : '') + '</p>';
      }
    }
    c.innerHTML = '<div class="mode-page"><h2>History</h2>' + statsHtml + '<div>' + listHtml + '</div><button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button></div>';
    if (total > 0 && typeof Chart !== 'undefined') {
      try {
        var ctx = id('history-donut').getContext('2d');
        var labels = ['Growing', 'Grounded', 'Drifting', 'Surviving', 'Quick Win'];
        var data = [counts.growing || 0, counts.grounded || 0, counts.drifting || 0, counts.surviving || 0, counts['quick-win'] || 0];
        var bg = ['#007BFF', '#246B45', '#DAA520', '#D9534F', '#6c757d'];
        if (window.__historyChart) try { window.__historyChart.destroy(); } catch (e) {}
        window.__historyChart = new Chart(ctx, { type: 'doughnut', data: { labels: labels, datasets: [{ data: data, backgroundColor: bg, hoverOffset: 10 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%' } });
      } catch (e) { console.warn('history chart failed', e); }
    }
  }

  function renderAbout() { var c = ensureContentElement(); c.innerHTML = '<div class="mode-page"><h2>About</h2><p>The Reset Compass helps align energy and action with your state. Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p><button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button></div>'; }

  /* --- Complete activity (records to localStorage + streak) --- */
  window.completeActivity = function (mode, activity, noteId, rowId) {
    try {
      var row = id(rowId);
      if (row) { row.classList.add('activity-complete-pop'); setTimeout(function () { try { row.classList.remove('activity-complete-pop'); } catch (e) {} }, 700); }
      var noteElem = document.getElementById(noteId);
      var note = noteElem ? noteElem.value : '';
      var date = new Date().toLocaleDateString();
      var normalized = (mode === 'quick' || mode === 'quick-win') ? 'quick-win' : mode;
      var entry = { date: date, mode: normalized, activity: activity, note: note };
      var history = JSON.parse(localStorage.getItem('resetHistory') || '[]');
      history.unshift(entry);
      localStorage.setItem('resetHistory', JSON.stringify(history));
      var lastLogged = localStorage.getItem('lastLogged');
      var today = new Date().toLocaleDateString();
      if (lastLogged !== today) {
        var streak = parseInt(localStorage.getItem('streak') || '0', 10) || 0;
        streak += 1;
        localStorage.setItem('streak', String(streak));
        localStorage.setItem('lastLogged', today);
        var sEl = id('streak-emoji');
        if (sEl) { sEl.classList.add('streak-pop'); setTimeout(function () { try { sEl.classList.remove('streak-pop'); } catch (e) {} }, 1100); }
        updateStreak();
      }
      runConfetti();
      setTimeout(function () { navigateHash('#history'); }, 700);
    } catch (e) { console.error('completeActivity error', e); window.__lastAppError = { msg: e.message || String(e), stack: e.stack || null, time: new Date().toISOString() }; }
  };

  function runConfetti() {
    try {
      var n = 12, container = document.createElement('div');
      container.style.position = 'fixed'; container.style.left = '50%'; container.style.top = '32%';
      container.style.pointerEvents = 'none'; container.style.zIndex = 99999; container.style.transform = 'translateX(-50%)';
      document.body.appendChild(container);
      for (var i = 0; i < n; i++) {
        (function () {
          var dot = document.createElement('div'), size = (8 + Math.round(Math.random() * 8)) + 'px';
          dot.style.width = size; dot.style.height = size; dot.style.borderRadius = '50%';
          dot.style.background = ['#FFD166', '#06D6A0', '#118AB2', '#EF476F'][i % 4];
          dot.style.position = 'absolute'; dot.style.left = '0'; dot.style.top = '0'; dot.style.opacity = '0.95';
          container.appendChild(dot);
          var angle = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 120, dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
          try { dot.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.9)', opacity: 0.9 }], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.9,.2,1)' }); } catch (e) {}
        })();
      }
      setTimeout(function () { try { container.remove(); } catch (e) {} }, 1400);
    } catch (e) { console.warn('confetti error', e); }
  }

  function updateStreak() { var el = id('streak-count'); if (el) el.textContent = localStorage.getItem('streak') || '0'; }

  /* --- Bind UI (delegation + simple binds) --- */
  function bindUI() {
    try {
      // nav links
      var navs = $$('.nav-links a[data-hash]');
      for (var i = 0; i < navs.length; i++) {
        (function (a) {
          if (!a.__bound) {
            a.addEventListener('click', function (e) { try { e && e.preventDefault && e.preventDefault(); } catch (ee) {} var h = a.getAttribute('data-hash') || a.getAttribute('href'); navigateHash(h); });
            a.__bound = true;
          }
        })(navs[i]);
      }
      // mode buttons
      var btns = $$('button[data-mode]');
      for (i = 0; i < btns.length; i++) {
        (function (b) {
          if (!b.__bound) {
            b.addEventListener('click', function (e) { try { e && e.preventDefault && e.preventDefault(); } catch (ee) {} var m = b.getAttribute('data-mode'); setTheme(m); navigateMode(m); });
            b.__bound = true;
          }
        })(btns[i]);
      }
      // delegated wedge click already handled in init below
    } catch (e) { console.warn('bindUI error', e); }
  }

  /* --- Initialization --- */
  document.addEventListener('DOMContentLoaded', function () {
    try {
      // show root immediately
      var root = id('app-root');
      if (root) { root.classList.add('visible'); root.setAttribute('aria-hidden', 'false'); }

      // ensure content
      ensureContentElement();

      // delegated wedge click
      var compass = id('compass');
      if (compass && !compass.__delegated) {
        compass.addEventListener('click', function (ev) {
          try {
            var tgt = ev.target;
            var path = (tgt && tgt.closest) ? tgt.closest('path[data-mode]') : null;
            if (!path) return;
            var mode = path.getAttribute('data-mode');
            setTheme(mode);
            navigateMode(mode);
          } catch (e) { console.warn('compass click', e); }
        });
        compass.__delegated = true;
      }

      // needle idle and scroll rotation setup (kept simple)
      var ng = id('needle-group');
      (function setupSpin() {
        var ANGLE = 720, lastY = 0, queued = false;
        function onScroll() { lastY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0; if (!queued) { queued = true; window.requestAnimationFrame(function () { queued = false; if (!ng) return; var doc = document.documentElement; var max = Math.max(1, doc.scrollHeight - window.innerHeight); var r = Math.max(0, Math.min(1, lastY / max)); ng.style.transform = 'rotate(' + (r * ANGLE) + 'deg)'; }); } }
        window.addEventListener('scroll', onScroll, { passive: true });
      })();

      // bind UI elements
      bindUI();

      // initial route + streak
      if (!location.hash) location.hash = '#home';
      try { renderRoute(); } catch (e) {}
      updateStreak();

      console.info('[app v116] initialized');
    } catch (err) {
      console.error('init failed', err);
      try { window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() }; } catch (e) {}
      var root = id('app-root') || document.body;
      if (root) { root.classList.add('visible'); root.setAttribute('aria-hidden', 'false'); }
    }
  });

})();