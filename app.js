// app.js v112 — cleaned, robust navigation+binding+spin implementation
// - Removes stray/non-JS content that caused the "Unexpected identifier 'javascript'" error
// - Ensures scroll-driven needle rotation (RAF + interval fallback)
// - Delegated wedge clicks + idempotent per-element bindings with retries
// - Exposes navigateHash/navigateMode/renderRoute globally
// - Defensive error capture at window.__lastAppError

(function () {
  'use strict';

  // Helpers
  function $(sel, root = document) { return Array.from((root || document).querySelectorAll(sel)); }
  function id(name) { return document.getElementById(name); }
  function safe(fn) { try { return fn(); } catch (e) { console.warn('safe caught', e); return null; } }

  // Diagnostic error capture
  window.__lastAppError = null;
  window.onerror = function (msg, url, line, col, err) {
    try { window.__lastAppError = { msg, url, line, col, err: err && (err.stack || err.message) || null, time: new Date().toISOString() }; } catch (e) { /* ignore */ }
    return false;
  };

  // Exposed navigation helpers (global)
  window.navigateHash = function (hash) {
    try { location.hash = hash; } catch (e) { console.warn('navigateHash failed', e); }
    safe(() => { if (typeof window.renderRoute === 'function') window.renderRoute(); });
  };

  window.navigateMode = function (mode) {
    try { location.hash = '#mode/' + mode; } catch (e) { console.warn('navigateMode failed', e); }
    safe(() => { if (typeof window.renderRoute === 'function') window.renderRoute(); });
  };

  // Main initialization
  document.addEventListener('DOMContentLoaded', () => {
    try {
      // Make sure app root is visible (we intentionally do not use the splash overlay)
      const appRoot = id('app-root');
      if (appRoot) { appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden', 'false'); }

      // Ensure needle group exists and does not block pointer events
      function getNeedleGroup() { return id('needle-group'); }
      (function ensureNeedle() {
        const ng = getNeedleGroup();
        if (ng) {
          try { ng.style.pointerEvents = 'none'; if (!ng.classList.contains('idle')) ng.classList.add('idle'); } catch (e) { /* ignore */ }
        }
      })();

      // Scroll-driven rotation: RAF + fallback interval
      const ANGLE_MAX = 720;
      let lastScrollY = 0;
      let rafFlag = false;
      let resumeTimer = null;
      let scrollActive = false;
      let interactionPause = false;

      function setInteractionPause(on) {
        interactionPause = !!on;
        const ng = getNeedleGroup();
        if (!on) {
          clearTimeout(resumeTimer);
          resumeTimer = setTimeout(() => { if (ng && !interactionPause) ng.classList.add('idle'); }, 260);
        } else {
          clearTimeout(resumeTimer);
          if (ng) ng.classList.remove('idle');
        }
      }

      function processScroll() {
        rafFlag = false;
        const ng = getNeedleGroup();
        if (!ng || interactionPause) return;
        const doc = document.documentElement;
        const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
        const ratio = Math.max(0, Math.min(1, lastScrollY / maxScroll));
        const angle = ratio * ANGLE_MAX;
        try {
          ng.classList.remove('idle');
          ng.style.transform = `rotate(${angle}deg)`;
        } catch (e) { /* ignore */ }
        scrollActive = true;
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => { if (ng && !interactionPause) ng.classList.add('idle'); scrollActive = false; }, 420);
      }

      function onScroll() {
        lastScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        if (!rafFlag) {
          rafFlag = true;
          window.requestAnimationFrame(processScroll);
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });

      // Fallback interval for environments where RAF may pause
      const fallbackInterval = setInterval(() => {
        const ng = getNeedleGroup();
        if (!ng || interactionPause) return;
        try {
          const doc = document.documentElement;
          const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
          const ratio = Math.max(0, Math.min(1, (window.scrollY || window.pageYOffset || 0) / maxScroll));
          const angle = ratio * ANGLE_MAX;
          ng.style.transform = `rotate(${angle}deg)`;
        } catch (e) { /* ignore */ }
      }, 350);

      window.addEventListener('beforeunload', () => clearInterval(fallbackInterval));

      // Delegated wedge click handling on the SVG container
      const compass = id('compass');
      if (compass) {
        compass.addEventListener('click', (ev) => {
          try {
            const path = ev.target && (ev.target.closest ? ev.target.closest('path[data-mode]') : null);
            if (!path) return;
            const mode = path.getAttribute('data-mode');
            // quick visual: bloom-strong then selection spin
            try { path.classList.remove('bloom'); path.classList.add('bloom-strong'); setTimeout(()=>path.classList.remove('bloom-strong'), 620); } catch(e){/*ignore*/}
            const ng = getNeedleGroup();
            if (ng) {
              ng.classList.remove('idle');
              ng.classList.add('needle-spin');
              setTimeout(()=> { ng.classList.remove('needle-spin'); ng.classList.add('idle'); window.navigateMode(mode); setInteractionPause(false); }, 560);
            } else {
              window.navigateMode(mode);
              setInteractionPause(false);
            }
            console.debug('[v112] delegated wedge click ->', mode);
          } catch (e) {
            console.warn('[v112] delegated click error', e);
          }
        });
      } else {
        console.warn('[v112] #compass not found - wedge delegation not attached');
      }

      // Idempotent per-element binding with retries
      function bindElements() {
        const result = { wedges: 0, buttons: 0 };
        try {
          const wedges = $('#compass path[data-mode]');
          result.wedges = wedges.length;
          wedges.forEach(w => {
            w.style.pointerEvents = 'auto';
            if (!w.__v112bound) {
              w.addEventListener('pointerenter', () => {
                setInteractionPause(true);
                try {
                  const angle = Number(w.getAttribute('data-angle') || 0);
                  const ng = getNeedleGroup();
                  if (ng) { ng.classList.remove('idle'); ng.style.transform = `rotate(${angle}deg)`; }
                } catch (e) {}
                try { w.classList.add('bloom'); } catch (e) {}
              });
              w.addEventListener('pointerleave', () => {
                try { w.classList.remove('bloom'); } catch (e) {}
                setInteractionPause(false);
              });
              w.__v112bound = true;
            }
          });

          const buttons = $('button[data-mode]');
          result.buttons = buttons.length;
          buttons.forEach(b => {
            b.style.pointerEvents = 'auto';
            if (!b.__v112bound) {
              b.addEventListener('click', (ev) => {
                try { if (ev && ev.preventDefault) ev.preventDefault(); } catch (e) {}
                const m = b.dataset.mode;
                console.debug('[v112] button click ->', m);
                window.navigateMode(m);
              });
              b.__v112bound = true;
            }
          });
        } catch (e) {
          console.warn('[v112] bindElements error', e);
        }
        return result;
      }

      // run binding attempts now and again (idempotent)
      const initialBind = bindElements();
      setTimeout(bindElements, 200);
      setTimeout(bindElements, 1200);
      console.info('[v112] initial binding', initialBind);

      // ROUTING: expose renderRoute and implement it (keeps previous behavior)
      function renderRoute() {
        try {
          const h = location.hash || '#home';
          const isFullPage = h !== '#home';
          const compassContainer = id('compass-container');
          const modeButtons = id('mode-buttons');
          const howTo = id('how-to');
          if (compassContainer) compassContainer.style.display = isFullPage ? 'none' : '';
          if (modeButtons) modeButtons.style.display = isFullPage ? 'none' : '';
          if (howTo) howTo.style.display = isFullPage ? 'none' : '';

          if (h.startsWith('#mode/')) {
            const mode = h.split('/')[1];
            renderModePage(mode);
          } else if (h === '#quick') {
            renderQuickWins();
          } else if (h === '#history') {
            renderHistory();
          } else if (h === '#about') {
            renderAbout();
          } else {
            renderHome();
          }
          safe(() => window.scrollTo({ top: 0, behavior: 'auto' }));
        } catch (e) {
          console.error('[v112] renderRoute failed', e);
        }
      }
      window.renderRoute = renderRoute;

      // Render helpers (kept compact)
      function renderHome() {
        const c = id('content'); if (!c) return; c.innerHTML = '';
        const compassContainer = id('compass-container'); const modeButtons = id('mode-buttons'); const howTo = id('how-to');
        if (compassContainer) compassContainer.style.display = ''; if (modeButtons) modeButtons.style.display = ''; if (howTo) howTo.style.display = '';
      }

      function renderModePage(mode) {
        const c = id('content'); if (!c) return;
        if (!activities[mode]) { c.innerHTML = `<p>Unknown mode</p>`; return; }
        c.innerHTML = `<div class="mode-page" role="region" aria-labelledby="mode-title"><h2 id="mode-title">${capitalize(mode)}</h2>` +
          activities[mode].map((act,i) => `<div class="activity-row" id="row-${mode}-${i}"><div class="activity-main"><span class="activity-icon" aria-hidden="true">${escapeHtml(act.icon)}</span><div class="activity-label">${escapeHtml(act.label)}</div></div><textarea id="note-${mode}-${i}" class="activity-note" placeholder="Notes (optional)"></textarea><div class="activity-controls"><button class="btn btn-complete" onclick="completeActivity('${mode}','${escapeJs(act.label)}','note-${mode}-${i}','row-${mode}-${i}')">Complete</button></div></div>`).join('') +
          `<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;
        const container = c.querySelector('.mode-page');
        if (container && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          Array.from(container.querySelectorAll('.activity-row')).forEach((row,i) => { row.style.animation = `fadeRow 420ms ease ${i*40}ms both`; });
        }
      }

      function renderQuickWins() {
        const c = id('content'); if (!c) return;
        const quick = [{ label:'Drink water', icon:'💧' }, { label:'Stand up and stretch', icon:'🧘' }, { label:'Take 3 deep breaths', icon:'🌬️' }];
        c.innerHTML = `<div class="mode-page"><h2>Quick Wins</h2>` + quick.map((q,i) => `<div class="activity-row" id="row-quick-${i}"><div class="activity-main"><span class="activity-icon">${escapeHtml(q.icon)}</span><div class="activity-label">${escapeHtml(q.label)}</div></div><textarea id="qw-${i}" class="activity-note" placeholder="Notes (optional)"></textarea><div class="activity-controls"><button class="btn btn-complete" onclick="completeActivity('quick-win','${escapeJs(q.label)}','qw-${i}','row-quick-${i}')">Complete</button></div></div>`).join('') + `<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;
      }

      function renderHistory() {
        const c = id('content'); if (!c) return;
        const history = JSON.parse(localStorage.getItem('resetHistory') || '[]');
        const counts = { growing:0, grounded:0, drifting:0, surviving:0, 'quick-win':0 };
        history.forEach(h => { const key=(h.mode||'').toLowerCase(); if (counts[key]!=null) counts[key] += 1; });
        const total = counts.growing + counts.grounded + counts.drifting + counts.surviving + counts['quick-win'];
        let statsHtml = total === 0 ? `<p>No entries yet. Complete an activity to build your stats.</p>` : `<div class="history-stats"><div class="history-chart-wrap"><canvas id="history-donut" aria-label="Mode distribution" role="img"></canvas></div></div>`;
        let listHtml = history.length === 0 ? '<p>No history yet.</p>' : history.map(h => `<p><strong>${escapeHtml(h.date)}:</strong> ${escapeHtml((h.mode||'').charAt(0).toUpperCase() + (h.mode||'').slice(1))} — ${escapeHtml(h.activity)}${h.note ? ' • <em>'+escapeHtml(h.note)+'</em>' : ''}</p>`).join('');
        c.innerHTML = `<div class="mode-page"><h2>History</h2>${statsHtml}<div>${listHtml}</div><button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;
        if (total > 0 && typeof Chart !== 'undefined') {
          try {
            const ctx = id('history-donut').getContext('2d');
            const labels = ['Growing','Grounded','Drifting','Surviving','Quick Win'];
            const data = [counts.growing||0, counts.grounded||0, counts.drifting||0, counts.surviving||0, counts['quick-win']||0];
            const bg = ['#007BFF','#246B45','#DAA520','#D9534F','#6c757d'];
            if (window.__historyChart) try { window.__historyChart.destroy(); } catch(e){}
            window.__historyChart = new Chart(ctx, { type:'doughnut', data: { labels, datasets: [{ data, backgroundColor: bg, hoverOffset: 10, borderWidth: 0 }] }, options: { responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{ legend:{ position:'bottom' } } } });
          } catch (e) { console.warn('history chart error', e); }
        }
      }

      function renderAbout() {
        const c = id('content'); if (!c) return;
        c.innerHTML = `<div class="mode-page"><h2>About</h2><p>The Reset Compass helps align energy and action with your state. Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p><button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;
      }

      // Activities dataset
      const activities = {
        growing: [{ label:"Write a goal", icon:"🎯" }, { label:"Tackle a challenge", icon:"⚒️" }, { label:"Start a new project", icon:"🚀" }],
        grounded: [{ label:"Declutter a space", icon:"🧹" }, { label:"Complete a task", icon:"✅" }, { label:"Plan your day", icon:"🗓️" }],
        drifting: [{ label:"Go for a walk", icon:"🚶" }, { label:"Journal your thoughts", icon:"✍️" }, { label:"Listen to calming music", icon:"🎧" }],
        surviving: [{ label:"Drink water", icon:"💧" }, { label:"Breathe deeply", icon:"🌬️" }, { label:"Rest for 5 minutes", icon:"😴" }]
      };

      // completeActivity exposed globally
      window.completeActivity = function (mode, activity, noteId, rowId) {
        try {
          const row = id(rowId);
          if (row) { row.classList.add('activity-complete-pop'); setTimeout(()=>row.classList.remove('activity-complete-pop'),700); }
          const note = noteId ? (document.getElementById(noteId)?.value || "") : "";
          const date = new Date().toLocaleDateString();
          const normalizedMode = (mode === 'quick' || mode === 'quick-win') ? 'quick-win' : mode;
          const entry = { date, mode: normalizedMode, activity, note };
          let history = JSON.parse(localStorage.getItem('resetHistory') || '[]');
          history.unshift(entry);
          localStorage.setItem('resetHistory', JSON.stringify(history));
          const lastLogged = localStorage.getItem('lastLogged');
          const today = new Date().toLocaleDateString();
          if (lastLogged !== today) {
            let streak = parseInt(localStorage.getItem('streak') || '0', 10) || 0;
            streak += 1;
            localStorage.setItem('streak', String(streak));
            localStorage.setItem('lastLogged', today);
            const streakEmoji = id('streak-emoji');
            if (streakEmoji) { streakEmoji.classList.add('streak-pop'); setTimeout(()=>streakEmoji.classList.remove('streak-pop'), 1100); }
            updateStreak();
          }
          runConfettiBurst();
          setTimeout(()=>{ navigateHash('#history'); }, 700);
        } catch (e) { console.error('completeActivity error', e); }
      };

      function runConfettiBurst() {
        try {
          const n = 14;
          const container = document.createElement('div');
          container.style.position = 'fixed';
          container.style.left = '50%';
          container.style.top = '32%';
          container.style.pointerEvents = 'none';
          container.style.zIndex = 99999;
          container.style.transform = 'translateX(-50%)';
          document.body.appendChild(container);
          for (let i=0;i<n;i++){
            const dot = document.createElement('div');
            dot.style.width = (8 + Math.round(Math.random()*8)) + 'px';
            dot.style.height = dot.style.width;
            dot.style.borderRadius = '50%';
            dot.style.background = ['#FFD166','#06D6A0','#118AB2','#EF476F'][i%4];
            dot.style.position = 'absolute';
            dot.style.left = '0';
            dot.style.top = '0';
            dot.style.opacity = '0.95';
            container.appendChild(dot);
            const angle = (Math.random()*Math.PI*2);
            const dist = 60 + Math.random()*120;
            const dx = Math.cos(angle)*dist;
            const dy = Math.sin(angle)*dist;
            dot.animate([{ transform:'translate(0,0) scale(1)', opacity:1 }, { transform:`translate(${dx}px, ${dy}px) scale(0.9)`, opacity:0.9 }], { duration:700+Math.random()*300, easing:'cubic-bezier(.2,.9,.2,1)'});
          }
          setTimeout(()=>container.remove(),1400);
        } catch (e) { console.warn('confetti error', e); }
      }

      function updateStreak() { const el = id('streak-count'); if (el) el.textContent = localStorage.getItem('streak') || '0'; }
      function capitalize(s){ return (s||'').charAt(0).toUpperCase() + (s||'').slice(1); }

      // ensure fadeRow keyframe exists
      (function(){ try { const style = document.createElement('style'); style.textContent = '@keyframes fadeRow{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'; document.head.appendChild(style); } catch(e){} })();

      // initial route & state
      if (!location.hash) location.hash = '#home';
      safe(() => renderRoute());
      updateStreak();

      console.info('[v111->v112] initialization complete; check Console for binding/interaction logs.');
    } catch (err) {
      console.error('[v112] initialization failed', err);
      try { window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() }; } catch(e) {}
      const root = id('app-root') || document.body;
      if (root) { root.classList.add('visible'); root.setAttribute('aria-hidden','false'); }
    }
  }); // DOMContentLoaded
})();
