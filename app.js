/* app.js v115 — theming, nicer UX transitions, and animations
   Built on the stable binding/renderer baseline. Paste/replace app.js exactly.
   Key additions:
   - setTheme(mode) applies .theme-<mode> class on .app-root, animates a subtle flash and header pulse.
   - renderModePage triggers theme enter animation and updates UI accents.
   - Hovering wedges briefly highlights theme color.
   - Defensive bindings and same route/render functions kept intact.
*/

(function () {
  'use strict';

  // Helpers
  function $(sel, root) { root = root || document; return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function id(n) { return document.getElementById(n); }
  function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, function (ch) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]); }); }
  function escapeJs(s) { return String(s || '').replace(/'/g, "\\'").replace(/"/g, '\\"'); }

  // Diagnostics
  window.__lastAppError = null;
  window.onerror = function (msg, url, line, col, err) {
    try { window.__lastAppError = { msg: msg, url: url, line: line, col: col, err: err && (err.stack || err.message) || null, time: new Date().toISOString() }; } catch (e) {}
    return false;
  };

  // Ensure #content exists
  function ensureContentElement() {
    var c = id('content');
    if (c) return c;
    var page = id('page') || document.querySelector('.page') || document.body;
    c = document.createElement('div');
    c.id = 'content';
    c.className = 'content-area';
    c.setAttribute('aria-live', 'polite');
    page.appendChild(c);
    console.info('[app] created #content fallback');
    return c;
  }

  // Theming: apply class and run an "enter" animation
  function setTheme(mode) {
    try {
      var root = id('app-root');
      if (!root) return;
      // remove other theme classes
      root.classList.remove('theme-growing','theme-grounded','theme-drifting','theme-surviving');
      if (mode) root.classList.add('theme-' + mode);
      // small visual flash to signal mode entry
      var existing = document.querySelector('.mode-flash');
      if (existing) { try { existing.remove(); } catch(e){} }
      var flash = document.createElement('div');
      flash.className = 'mode-flash';
      root.appendChild(flash);
      // briefly add mode-enter class to slightly elevate UI
      root.classList.add('mode-enter');
      setTimeout(function(){ try { root.classList.remove('mode-enter'); } catch(e){} }, 820);
    } catch (e) { console.warn('setTheme failed', e); }
  }

  // Expose navigation helpers
  window.navigateHash = function (hash) {
    try { location.hash = hash; } catch (e) { console.warn(e); }
    try { if (typeof window.renderRoute === 'function') window.renderRoute(); } catch (e) {}
  };
  window.navigateMode = function (mode) {
    try { location.hash = '#mode/' + mode; } catch (e) { console.warn(e); }
    try { if (typeof window.renderRoute === 'function') window.renderRoute(); } catch (e) {}
  };

  // Start when DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    try {
      console.info('[v115] init');

      // show app root
      var root = id('app-root');
      if (root) { root.classList.add('visible'); root.setAttribute('aria-hidden','false'); }

      // ensure needle non-interactive
      var needleGroup = id('needle-group');
      if (needleGroup) { needleGroup.style.pointerEvents = 'none'; if (!needleGroup.classList.contains('idle')) needleGroup.classList.add('idle'); }

      // scroll-driven rotation (0 -> 720)
      var ANGLE_MAX = 720;
      var lastScrollY = 0, rafQ = false, resumeTimer = null, interactionPause = false, scrollActive = false;
      function setInteractionPause(on) { interactionPause = !!on; var ng = id('needle-group'); if (!on) { clearTimeout(resumeTimer); resumeTimer = setTimeout(function(){ if (ng && !interactionPause) ng.classList.add('idle'); }, 260); } else { clearTimeout(resumeTimer); if (ng) ng.classList.remove('idle'); } }
      function processScroll() {
        rafQ = false;
        var ng = id('needle-group');
        if (!ng || interactionPause) return;
        var doc = document.documentElement;
        var max = Math.max(1, doc.scrollHeight - window.innerHeight);
        var ratio = Math.max(0, Math.min(1, lastScrollY / max));
        var angle = ratio * ANGLE_MAX;
        try { ng.classList.remove('idle'); ng.style.transform = 'rotate(' + angle + 'deg)'; } catch(e){}
        scrollActive = true;
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function(){ if (ng && !interactionPause) ng.classList.add('idle'); scrollActive = false; }, 420);
      }
      function onScroll() { lastScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0; if (!rafQ) { rafQ = true; window.requestAnimationFrame(processScroll); } }
      window.addEventListener('scroll', onScroll, { passive:true });
      var fallbackInterval = setInterval(function(){ var ng = id('needle-group'); if (!ng || interactionPause) return; try { var d = document.documentElement; var m = Math.max(1, d.scrollHeight - window.innerHeight); var r = Math.max(0, Math.min(1, (window.scrollY || window.pageYOffset || 0) / m)); ng.style.transform = 'rotate(' + (r*ANGLE_MAX) + 'deg)'; } catch(e){} }, 350);
      window.addEventListener('beforeunload', function(){ clearInterval(fallbackInterval); });

      // delegated wedge click
      var compass = id('compass');
      if (compass) {
        compass.addEventListener('click', function (ev) {
          try {
            var tgt = ev.target;
            var path = (tgt && tgt.closest) ? tgt.closest('path[data-mode]') : null;
            if (!path) return;
            var mode = path.getAttribute('data-mode');
            // visual: bloom + spin
            try { path.classList.remove('bloom'); path.classList.add('bloom-strong'); setTimeout(function(){ path.classList.remove('bloom-strong'); }, 620); } catch(e){}
            var ng = id('needle-group');
            if (ng) {
              ng.classList.remove('idle');
              ng.classList.add('needle-spin');
              setTimeout(function(){ ng.classList.remove('needle-spin'); ng.classList.add('idle'); setTheme(mode); navigateMode(mode); setInteractionPause(false); }, 560);
            } else {
              setTheme(mode);
              navigateMode(mode);
              setInteractionPause(false);
            }
            console.debug('[v115] wedge click ->', mode);
          } catch (err) { console.warn(err); }
        });

        // subtle hover effect: apply theme tint while hovering a wedge
        var wedgeEls = $( '#compass path[data-mode]', compass );
        wedgeEls.forEach(function(w){
          w.addEventListener('pointerenter', function(){ var m = w.getAttribute('data-mode'); if (root) root.classList.add('theme-' + m + '-hover'); setInteractionPause(true); });
          w.addEventListener('pointerleave', function(){ var m = w.getAttribute('data-mode'); if (root) root.classList.remove('theme-' + m + '-hover'); setInteractionPause(false); });
        });
      }

      // idempotent per-element binds
      function bindUI(){
        try {
          var wedges = $( '#compass path[data-mode]' );
          wedges.forEach(function(w){
            w.style.pointerEvents = 'auto';
            if (!w.__v115) {
              w.__v115 = true;
              w.addEventListener('pointerenter', function(){ setInteractionPause(true); var angle = Number(w.getAttribute('data-angle')||0); var ng = id('needle-group'); if (ng) { ng.classList.remove('idle'); ng.style.transform = 'rotate(' + angle + 'deg)'; } try { w.classList.add('bloom'); } catch(e){} });
              w.addEventListener('pointerleave', function(){ try { w.classList.remove('bloom'); } catch(e){} setInteractionPause(false); });
            }
          });

          var buttons = $( 'button[data-mode]' );
          buttons.forEach(function(b){
            b.style.pointerEvents = 'auto';
            if (!b.__v115) {
              b.__v115 = true;
              b.addEventListener('click', function(ev){ try { ev && ev.preventDefault && ev.preventDefault(); } catch(e){} var m = b.getAttribute('data-mode'); setTheme(m); console.debug('[v115] button click ->', m); navigateMode(m); });
            }
          });

          var navLinks = $( '.nav-links a[data-hash]' );
          navLinks.forEach(function(a){
            a.style.pointerEvents = 'auto';
            if (!a.__v115) {
              a.__v115 = true;
              a.addEventListener('click', function(ev){ try { ev && ev.preventDefault && ev.preventDefault(); } catch(e){} var h = a.getAttribute('data-hash') || a.getAttribute('href'); console.debug('[v115] nav click ->', h); if (h) navigateHash(h); });
            }
          });

          return { wedges: wedges.length, buttons: buttons.length, nav: navLinks.length };
        } catch(e){ console.warn('bindUI error', e); return { error: e && e.message || String(e) }; }
      }
      var bindResult = bindUI(); setTimeout(bindUI, 220); setTimeout(bindUI, 1200);
      console.info('[v115] bind attempted', bindResult);

      // Renderers and activity data (kept compact)
      function renderRoute(){
        try {
          var h = location.hash || '#home';
          console.debug('[v115] renderRoute ->', h);
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
          try { window.scrollTo(0,0); } catch(e){}
        } catch(e){ console.error(e); }
      }
      window.renderRoute = renderRoute;

      function renderHome(){ var c = ensureContentElement(); c.innerHTML = ''; setTheme(''); }
      function renderModePage(mode){
        var c = ensureContentElement();
        setTheme(mode);
        if (!activities[mode]){ c.innerHTML = '<p>Unknown mode</p>'; return; }
        var html = '<div class="mode-page" role="region" aria-labelledby="mode-title"><h2 id="mode-title">' + mode.charAt(0).toUpperCase() + mode.slice(1) + '</h2>';
        activities[mode].forEach(function(act, i){
          html += '<div class="activity-row" id="row-' + mode + '-' + i + '"><div class="activity-main"><span class="activity-icon" aria-hidden="true">' + escapeHtml(act.icon) + '</span><div class="activity-label">' + escapeHtml(act.label) + '</div></div>';
          html += '<textarea id="note-' + mode + '-' + i + '" class="activity-note" placeholder="Notes (optional)"></textarea>';
          html += '<div class="activity-controls"><button class="btn btn-complete" onclick="completeActivity(\'' + mode + '\',\'' + escapeJs(act.label) + '\',\'note-' + mode + '-' + i + '\',\'row-' + mode + '-' + i + '\')">Complete</button></div></div>';
        });
        html += '<button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button></div>';
        c.innerHTML = html;
        // animate rows
        var rows = c.querySelectorAll('.activity-row');
        for (var r = 0; r < rows.length; r++) rows[r].style.animation = 'fadeRow 420ms ease ' + (r * 40) + 'ms both';
      }

      function renderQuickWins(){ var c = ensureContentElement(); var quick = [{label:'Drink water',icon:'💧'},{label:'Stand up and stretch',icon:'🧘'},{label:'Take 3 deep breaths',icon:'🌬️'}]; var html = '<div class="mode-page"><h2>Quick Wins</h2>'; quick.forEach(function(q,i){ html += '<div class="activity-row" id="row-quick-' + i + '"><div class="activity-main"><span class="activity-icon">' + escapeHtml(q.icon) + '</span><div class="activity-label">' + escapeHtml(q.label) + '</div></div><textarea id="qw-' + i + '" class="activity-note" placeholder="Notes (optional)"></textarea><div class="activity-controls"><button class="btn btn-complete" onclick="completeActivity(\'quick-win\',\'' + escapeJs(q.label) + '\',\'qw-' + i + '\',\'row-quick-' + i + '\')">Complete</button></div></div>'; }); html += '<button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button></div>'; c.innerHTML = html; }

      function renderHistory(){ var c = ensureContentElement(); var history = JSON.parse(localStorage.getItem('resetHistory') || '[]'); var counts = { growing:0, grounded:0, drifting:0, surviving:0, 'quick-win':0 }; history.forEach(function(h){ var k = (h.mode || '').toLowerCase(); if (typeof counts[k] !== 'undefined') counts[k] += 1; }); var total = counts.growing + counts.grounded + counts.drifting + counts.surviving + counts['quick-win']; var statsHtml = total === 0 ? '<p>No entries yet. Complete an activity to build your stats.</p>' : '<div class="history-stats"><div class="history-chart-wrap"><canvas id="history-donut" aria-label="Mode distribution" role="img"></canvas></div></div>'; var listHtml = history.length === 0 ? '<p>No history yet.</p>' : history.map(function(h){ return '<p><strong>' + escapeHtml(h.date) + ':</strong> ' + escapeHtml((h.mode||'').charAt(0).toUpperCase() + (h.mode||'').slice(1)) + ' — ' + escapeHtml(h.activity) + (h.note ? ' • <em>' + escapeHtml(h.note) + '</em>' : '') + '</p>'; }).join(''); c.innerHTML = '<div class="mode-page"><h2>History</h2>' + statsHtml + '<div>' + listHtml + '</div><button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button></div>'; if (total > 0 && typeof Chart !== 'undefined') { try { var ctx = id('history-donut').getContext('2d'); var labels = ['Growing','Grounded','Drifting','Surviving','Quick Win']; var data = [counts.growing||0,counts.grounded||0,counts.drifting||0,counts.surviving||0,counts['quick-win']||0]; var bg = ['#007BFF','#246B45','#DAA520','#D9534F','#6c757d']; if (window.__historyChart) try { window.__historyChart.destroy(); } catch(e){} window.__historyChart = new Chart(ctx, { type:'doughnut', data:{ labels: labels, datasets:[{ data: data, backgroundColor: bg, hoverOffset: 10, borderWidth: 0 }] }, options:{ responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{ legend:{ position:'bottom' } } } }); } catch(e) { console.warn('history chart error', e); } }

      function renderAbout(){ var c = ensureContentElement(); c.innerHTML = '<div class="mode-page"><h2>About</h2><p>The Reset Compass helps align energy and action with your state. Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p><button class="return-button" onclick="navigateHash(\'#home\')">Return to the Compass</button></div>'; }

      var activities = {
        growing: [{ label: 'Write a goal', icon: '🎯' }, { label: 'Tackle a challenge', icon: '⚒️' }, { label: 'Start a new project', icon: '🚀' }],
        grounded: [{ label: 'Declutter a space', icon: '🧹' }, { label: 'Complete a task', icon: '✅' }, { label: 'Plan your day', icon: '🗓️' }],
        drifting: [{ label: 'Go for a walk', icon: '🚶' }, { label: 'Journal your thoughts', icon: '✍️' }, { label: 'Listen to calming music', icon: '🎧' }],
        surviving: [{ label: 'Drink water', icon: '💧' }, { label: 'Breathe deeply', icon: '🌬️' }, { label: 'Rest for 5 minutes', icon: '😴' }]
      };

      window.completeActivity = function (mode, activity, noteId, rowId) {
        try {
          var row = id(rowId);
          if (row) { row.classList.add('activity-complete-pop'); setTimeout(function(){ row.classList.remove('activity-complete-pop'); }, 700); }
          var noteElem = document.getElementById(noteId);
          var note = noteElem ? noteElem.value : '';
          var date = new Date().toLocaleDateString();
          var normalizedMode = (mode === 'quick' || mode === 'quick-win') ? 'quick-win' : mode;
          var entry = { date: date, mode: normalizedMode, activity: activity, note: note };
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
            var streakEmoji = id('streak-emoji');
            if (streakEmoji) { streakEmoji.classList.add('streak-pop'); setTimeout(function(){ streakEmoji.classList.remove('streak-pop'); }, 1100); }
            updateStreak();
          }
          runConfettiBurst();
          setTimeout(function(){ navigateHash('#history'); }, 700);
        } catch (e) { console.error('completeActivity error', e); }
      };

      function runConfettiBurst(){ try{ var n=14; var container=document.createElement('div'); container.style.position='fixed'; container.style.left='50%'; container.style.top='32%'; container.style.pointerEvents='none'; container.style.zIndex=99999; container.style.transform='translateX(-50%)'; document.body.appendChild(container); for (var i=0;i<n;i++){ var dot=document.createElement('div'); var size=(8+Math.round(Math.random()*8))+'px'; dot.style.width=size; dot.style.height=size; dot.style.borderRadius='50%'; dot.style.background=['#FFD166','#06D6A0','#118AB2','#EF476F'][i%4]; dot.style.position='absolute'; dot.style.left='0'; dot.style.top='0'; dot.style.opacity='0.95'; container.appendChild(dot); (function(dot){ var angle=(Math.random()*Math.PI*2); var dist=60+Math.random()*120; var dx=Math.cos(angle)*dist; var dy=Math.sin(angle)*dist; try{ dot.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:'translate(' + dx + 'px, ' + dy + 'px) scale(0.9)',opacity:0.9}], { duration:700+Math.random()*300, easing:'cubic-bezier(.2,.9,.2,1)' }); }catch(e){} })(dot); } setTimeout(function(){ try{ container.remove(); } catch(e){} }, 1400); }catch(e){ console.warn('confetti error', e); } }

      function updateStreak(){ var el = id('streak-count'); if (el) el.textContent = localStorage.getItem('streak') || '0'; }

      // ensure fadeRow keyframe
      (function(){ try{ var st = document.createElement('style'); st.textContent='@keyframes fadeRow{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'; document.head.appendChild(st); } catch(e){} })();

      // initial route
      if (!location.hash) location.hash = '#home';
      try { renderRoute(); } catch(e){ console.warn(e); }
      updateStreak();
      console.info('[v115] initialization complete');
    } catch (err) {
      console.error('[v115] init failed', err);
      try { window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() }; } catch(e){}
      var r = id('app-root') || document.body;
      if (r) { r.classList.add('visible'); r.setAttribute('aria-hidden','false'); }
    }
  });
})();