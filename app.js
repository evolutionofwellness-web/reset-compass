/* app.js v120 — reliable bindings, readable wedge text, improved Quick Wins styling
   - ES5-friendly
   - Robust $$ helper
   - Delegated wedge clicks + defensive binding
   - Mode metadata (descriptions & tips)
   - Quick Wins card layout and clear Complete button
   - Exposes window.__rebindUI() to rebind handlers from console if needed
*/

(function () {
  'use strict';

  /* Helpers */
  function $(sel, root) { root = root || document; return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  if (typeof window.$$ !== 'function') {
    window.$$ = function (sel, root) { root = root || document; try { return Array.prototype.slice.call(root.querySelectorAll(sel)); } catch (e) { return []; } };
  }
  function id(name) { return document.getElementById(name); }
  function escapeHtml(s) { s = String(s || ''); return s.replace(/[&<>"']/g, function (ch) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]); }); }
  function escapeJs(s) { s = String(s || ''); return s.replace(/'/g, "\\'").replace(/"/g, '\\"'); }

  /* Capture last error */
  window.__lastAppError = null;
  window.onerror = function (msg, url, line, col, err) {
    try { window.__lastAppError = { msg: msg, url: url, line: line, col: col, err: err && (err.stack || err.message) || null, time: new Date().toISOString() }; } catch (e) {}
    return false;
  };

  /* Mode info */
  var modeInfo = {
    growing: { title: 'Growing', desc: 'Push yourself to new heights — tackle meaningful tasks that expand capability and momentum.', tip: 'Pick one focused, slightly-challenging task you can make progress on in 15–30 minutes.' },
    grounded: { title: 'Grounded', desc: 'Stay centered and productive — structure your next steps and clear small hurdles.', tip: 'Break a larger task into 2–3 small wins and complete the first one now.' },
    drifting: { title: 'Drifting', desc: 'Gently regain focus and energy — calming movement, brief reflection, or a reset can help.', tip: 'Try a 7–10 minute walk or a 5-minute journaling exercise to refocus.' },
    surviving: { title: 'Surviving', desc: 'Just get through the day — prioritize essentials and basic self-care to stay afloat.', tip: 'Pick one low-effort, high-impact action (water, breathe, rest) and pause for 3–5 minutes.' }
  };

  /* Activities */
  var activities = {
    growing: [{ label: 'Write a goal', icon: '🎯' }, { label: 'Tackle a challenge', icon: '⚒️' }, { label: 'Start a new project', icon: '🚀' }],
    grounded: [{ label: 'Declutter a space', icon: '🧹' }, { label: 'Complete a task', icon: '✅' }, { label: 'Plan your day', icon: '🗓️' }],
    drifting: [{ label: 'Go for a walk', icon: '🚶' }, { label: 'Journal your thoughts', icon: '✍️' }, { label: 'Listen to calming music', icon: '🎧' }],
    surviving: [{ label: 'Drink water', icon: '💧' }, { label: 'Breathe deeply', icon: '🌬️' }, { label: 'Rest for 5 minutes', icon: '😴' }]
  };

  /* Exposed navigation helpers */
  window.navigateHash = function (hash) { try { location.hash = hash; } catch (e) { console.warn(e); } try { if (typeof window.renderRoute === 'function') window.renderRoute(); } catch (e) {} };
  window.navigateMode = function (mode) { try { location.hash = '#mode/' + mode; } catch (e) { console.warn(e); } try { if (typeof window.renderRoute === 'function') window.renderRoute(); } catch (e) {} };

  /* Ensure #content */
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

  /* Theme setter (no animations) */
  function setTheme(mode) {
    try {
      var root = id('app-root');
      if (!root) return;
      root.classList.remove('theme-growing', 'theme-grounded', 'theme-drifting', 'theme-surviving');
      if (mode) root.classList.add('theme-' + mode);
    } catch (e) {}
  }

  /* Renderers */
  function renderRoute() {
    try {
      var h = location.hash || '#home';
      var isFull = h !== '#home';
      var compassContainer = id('compass-container'), modeButtons = id('mode-buttons'), howTo = id('how-to');
      if (compassContainer) compassContainer.style.display = isFull ? 'none' : '';
      if (modeButtons) modeButtons.style.display = isFull ? 'none' : '';
      if (howTo) howTo.style.display = isFull ? 'none' : '';
      if (h.indexOf('#mode/') === 0) renderModePage(h.split('/')[1]);
      else if (h === '#quick') renderQuickWins();
      else if (h === '#history') renderHistory();
      else if (h === '#about') renderAbout();
      else renderHome();
      try { window.scrollTo(0, 0); } catch (e) {}
    } catch (e) { console.error('renderRoute failed', e); window.__lastAppError = { msg: e.message || String(e), stack: e.stack || null, time: new Date().toISOString() }; }
  }
  window.renderRoute = renderRoute;

  function renderHome() {
    var c = ensureContentElement();
    c.innerHTML = '';
    setTheme('');
  }

  function renderModePage(mode) {
    var c = ensureContentElement();
    setTheme(mode);
    var info = modeInfo[mode] || { title: mode, desc: '', tip: '' };
    if (!activities[mode]) { c.innerHTML = '<p>Unknown mode</p>'; return; }

    var html = '<div class="mode-page" role="region" aria-labelledby="mode-title">';
    html += '<h2 id="mode-title">' + escapeHtml(info.title) + '</h2>';
    if (info.desc) html += '<div class="mode-desc">' + escapeHtml(info.desc) + '</div>';
    if (info.tip) html += '<div class="mode-tip">Tip: ' + escapeHtml(info.tip) + '</div>';

    // activities
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
    var c = ensureContentElement();
    var quick = [{ label: 'Drink water', icon: '💧' }, { label: 'Stand up and stretch', icon: '🧘' }, { label: 'Take 3 deep breaths', icon: '🌬️' }];
    var html = '<div class="mode-page"><h2>Quick Wins</h2><div class="quick-list">';
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
    var c = ensureContentElement();
    var history = JSON.parse(localStorage.getItem('resetHistory') || '[]');
    var counts = { growing: 0, grounded: 0, drifting: 0, surviving: 0, 'quick-win': 0 };
    for (var j = 0; j < history.length; j++) {
      var k = (history[j].mode || '').toLowerCase();
      if (typeof counts[k] !== 'undefined') counts[k]++;
    }
    var total = counts.growing + counts.grounded + counts.drifting + counts.surviving + counts['quick-win'];
    var statsHtml = total === 0 ? '<p>No entries yet. Complete an activity to build your stats.</p>' : '<div class="history-stats"><div class="history-chart-wrap"><canvas id="history-donut" aria-label="Mode distribution" role="img"></canvas></div></div>';
    var listHtml = '';
    if (history.length === 0) listHtml = '<p>No history yet.</p>'; else for (var i2 = 0; i2 < history.length; i2++) listHtml += '<p><strong>' + escapeHtml(history[i2].date) + ':</strong> ' + escapeHtml((history[i2].mode || '').charAt(0).toUpperCase() + (history[i2].mode || '').slice(1)) + ' — ' + escapeHtml(history[i2].activity) + (history[i2].note ? ' • <em>' + escapeHtml(history[i2].note) + '</em>' : '') + '</p>';
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

  /* completeActivity */
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
      // small confetti that doesn't rely on CSS animations
      try { runConfetti(); } catch (e) {}
      setTimeout(function () { navigateHash('#history'); }, 700);
    } catch (e) { console.error('completeActivity error', e); window.__lastAppError = { msg: e.message || String(e), stack: e.stack || null, time: new Date().toISOString() }; }
  };

  function runConfetti() {
    try {
      var n = 10, container = document.createElement('div');
      container.style.position = 'fixed'; container.style.left = '50%'; container.style.top = '32%';
      container.style.pointerEvents = 'none'; container.style.zIndex = 99999; container.style.transform = 'translateX(-50%)';
      document.body.appendChild(container);
      for (var i3 = 0; i3 < n; i3++) {
        var dot = document.createElement('div'), size = (6 + Math.round(Math.random() * 8)) + 'px';
        dot.style.width = size; dot.style.height = size; dot.style.borderRadius = '50%';
        dot.style.background = ['#FFD166', '#06D6A0', '#118AB2', '#EF476F'][i3 % 4];
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

  function updateStreak() { var el = id('streak-count'); if (el) el.textContent = localStorage.getItem('streak') || '0'; }

  /* Bind UI (nav + buttons) */
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

  /* Delegated wedge click */
  function attachCompassDelegation() {
    var comp = id('compass');
    if (!comp) return;
    if (comp.__delegated) return;
    comp.addEventListener('click', function (ev) {
      try {
        var tgt = ev.target;
        var path = (tgt && tgt.closest) ? tgt.closest('path[data-mode]') : null;
        if (!path) return;
        var mode = path.getAttribute('data-mode');
        setTheme(mode);
        renderModePage(mode);
        navigateMode(mode);
      } catch (e) { console.warn('compass click', e); }
    });
    comp.__delegated = true;
  }

  /* Needle transform on scroll */
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

  /* Expose rebind helper for debugging */
  window.__rebindUI = function () {
    try { bindUI(); attachCompassDelegation(); setupNeedleSpin(); console.info('rebindUI: done'); } catch (e) { console.warn('rebindUI failed', e); }
  };

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
      console.info('[app v120] initialized');
    } catch (err) {
      console.error('init failed', err);
      try { window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() }; } catch (e) {}
      var rt = id('app-root') || document.body; if (rt) { rt.classList.add('visible'); rt.setAttribute('aria-hidden', 'false'); }
    }
  });

})();