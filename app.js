/* app.js (v128) — add feature-flagged guided session functionality (no animations) */
(function(){
  'use strict';

  window.APP_VERSION = window.APP_VERSION || 'v128';
  window.__features = window.__features || {};
  // Enable sessions by default on the feature branch; can be toggled off in console
  window.__features.sessions = (typeof window.__features.sessions === 'boolean') ? window.__features.sessions : true;

  /* existing helpers kept (ensure these match your current stable file) */
  function id(n){ return document.getElementById(n); }
  function $$(sel, root){ root = root || document; try { return Array.prototype.slice.call(root.querySelectorAll(sel)); } catch(e) { return []; } }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }

  /* Existing renderers and routing must remain unchanged; this file appends session helpers and integrates them non-intrusively. */

  // Session defaults (in seconds)
  var sessionDefaults = {
    growing: 25 * 60,
    grounded: 15 * 60,
    drifting: 5 * 60,
    surviving: 3 * 60,
    quick: 1 * 60
  };

  var session = {
    timerId: null,
    remaining: 0,
    mode: null,
    running: false
  };

  function persistSession() {
    try {
      var key = 'session.' + (session.mode || 'none');
      var obj = { remaining: session.remaining, mode: session.mode, running: session.running, timestamp: Date.now() };
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
      session.mode = mode;
      session.remaining = typeof obj.remaining === 'number' ? obj.remaining : sessionDefaults[mode] || 60;
      session.running = !!obj.running;
      return true;
    } catch (e) { return false; }
  }

  function clearPersistedSession(mode) {
    try { localStorage.removeItem('session.' + (mode || session.mode || 'none')); } catch (e) {}
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  }

  function startTimerForMode(mode, onDone) {
    try {
      stopTimer();
      session.mode = mode;
      session.remaining = sessionDefaults[mode] || 60;
      session.running = true;
      persistSession();
      var display = id('session-timer');
      if (display) display.textContent = formatTime(session.remaining);
      session.timerId = setInterval(function(){
        session.remaining -= 1;
        if (display) display.textContent = formatTime(session.remaining);
        persistSession();
        if (session.remaining <= 0) {
          stopTimer();
          session.running = false;
          clearPersistedSession(mode);
          if (typeof onDone === 'function') onDone();
        }
      }, 1000);
    } catch (e) { console.warn('startTimerForMode', e); }
  }

  function stopTimer() {
    if (session.timerId) { clearInterval(session.timerId); session.timerId = null; session.running = false; }
    persistSession();
  }

  // Non-animated confetti (safe)
  function runConfetti(mode) {
    try {
      var colors = { growing:['#79C7FF','#2FA0FF','#007BFF'], grounded:['#B7E7C7','#7FD1A1','#2e8b57'], drifting:['#FFE9A8','#FFD166','#D6A520'], surviving:['#FFD3D6','#F08F91','#D9534F'], quick:['#E7E0FF','#C1B3FF','#6f42c1'] };
      var palette = colors[mode] || colors['quick'];
      var n = 10, container = document.createElement('div');
      container.style.position = 'fixed'; container.style.left = '50%'; container.style.top = '32%'; container.style.pointerEvents = 'none'; container.style.zIndex = 99999; container.style.transform = 'translateX(-50%)';
      document.body.appendChild(container);
      for (var i = 0; i < n; i++) {
        var dot = document.createElement('div'), size = (6 + Math.round(Math.random() * 8)) + 'px';
        dot.style.width = size; dot.style.height = size; dot.style.borderRadius = '50%';
        dot.style.background = palette[i % palette.length];
        dot.style.margin = (Math.random() * 10) + 'px';
        container.appendChild(dot);
      }
      setTimeout(function(){ try{ container.remove(); }catch(e){} }, 900);
    } catch (e) { console.warn('confetti error', e); }
  }

  // Add a history entry
  function pushGuidedSessionHistory(mode) {
    try {
      var date = new Date().toLocaleDateString();
      var entry = { date: date, mode: mode, activity: 'Guided session complete', note: '' };
      var hist = JSON.parse(localStorage.getItem('resetHistory') || '[]');
      hist.unshift(entry);
      localStorage.setItem('resetHistory', JSON.stringify(hist));
      // update streak if needed
      var lastLogged = localStorage.getItem('lastLogged');
      var today = new Date().toLocaleDateString();
      if (lastLogged !== today) {
        var streak = parseInt(localStorage.getItem('streak') || '0', 10) || 0;
        streak += 1;
        localStorage.setItem('streak', String(streak));
        localStorage.setItem('lastLogged', today);
        var el = id('streak-count'); if (el) el.textContent = String(streak);
      }
    } catch (e) {}
  }

  // Modal helpers
  function openSessionModal(mode) {
    try {
      if (!window.__features.sessions) return;
      var modal = id('session-modal'), body = id('session-body'), title = id('session-title');
      if (!modal || !body || !title) return;
      title.textContent = (mode.charAt(0).toUpperCase() + mode.slice(1)) + ' — Guided session';
      body.innerHTML = buildSessionBody(mode);
      modal.hidden = false;
      // restore any persisted session for this mode
      if (restoreSessionForMode(mode)) {
        var display = id('session-timer'); if (display) display.textContent = formatTime(session.remaining);
      } else {
        var display = id('session-timer'); if (display) display.textContent = formatTime(sessionDefaults[mode] || 60);
      }
      createSessionBindings(mode);
      // focus panel for accessibility
      var panel = modal.querySelector('.modal-panel'); if (panel) panel.focus && panel.setAttribute('tabindex', '-1');
    } catch (e) { console.warn('openSessionModal', e); }
  }

  function closeSessionModal() {
    try {
      var modal = id('session-modal'); if (!modal) return;
      modal.hidden = true;
      stopTimer();
    } catch (e) {}
  }

  function buildSessionBody(mode) {
    var html = '';
    html += '<p class="helper">Follow this short guided session.</p>';
    html += '<div class="timer"><div class="timer-display" id="session-timer">' + formatTime(sessionDefaults[mode] || 60) + '</div><div class="helper">Recommended</div></div>';
    html += '<div class="step-list">';
    // simple steps per mode
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
    } else { // quick
      html += '<div class="step-item"><input type="checkbox" id="step-1"><label for="step-1">Drink water</label></div>';
      html += '<div class="step-item"><input type="checkbox" id="step-2"><label for="step-2">Stretch</label></div>';
    }
    html += '</div>';
    return html;
  }

  function createSessionBindings(mode) {
    var modal = id('session-modal');
    if (!modal) return;
    // remove existing handlers if present
    if (modal._startFn) {
      var start = id('session-start'); start && start.removeEventListener('click', modal._startFn);
      var cancel = id('session-cancel'); cancel && cancel.removeEventListener('click', modal._cancelFn);
      var closeBtn = id('session-close'); closeBtn && closeBtn.removeEventListener('click', modal._closeFn);
      document.removeEventListener('keydown', modal._keyHandler);
    }
    modal._startFn = function() {
      startTimerForMode(mode, function(){
        // onDone
        pushGuidedSessionHistory(mode);
        runConfetti(mode);
        setTimeout(function(){ closeSessionModal(); }, 600);
      });
    };
    modal._cancelFn = function(){ closeSessionModal(); };
    modal._closeFn = function(){ closeSessionModal(); };
    modal._keyHandler = function(e){ if (e.key === 'Escape') closeSessionModal(); };

    var startBtn = id('session-start'); startBtn && startBtn.addEventListener('click', modal._startFn);
    var cancelBtn = id('session-cancel'); cancelBtn && cancelBtn.addEventListener('click', modal._cancelFn);
    var closeBtn = id('session-close'); closeBtn && closeBtn.addEventListener('click', modal._closeFn);
    document.addEventListener('keydown', modal._keyHandler);

    // clicking backdrop closes
    modal.addEventListener('click', function(e){ if (e.target === modal) closeSessionModal(); });
  }

  // Integration: add Start session CTA to mode pages when rendering (non-intrusive)
  // This expects renderModePage to exist and call window.__rebindUI after rendering; we'll append a button if sessions enabled.
  function appendSessionCTA(mode) {
    try {
      if (!window.__features.sessions) return;
      var content = id('content');
      if (!content) return;
      // find the first mode-page rendered and append CTA area if not present
      var mp = content.querySelector('.mode-page');
      if (!mp) return;
      if (mp.querySelector('[data-start-session]')) return;
      var wrapper = document.createElement('div'); wrapper.style.margin = '12px 0';
      var btn = document.createElement('button');
      btn.className = 'btn-primary';
      btn.setAttribute('data-start-session', 'true');
      btn.setAttribute('data-mode', mode);
      btn.textContent = 'Start session';
      wrapper.appendChild(btn);
      mp.insertBefore(wrapper, mp.firstChild ? mp.firstChild.nextSibling : null);

      // attach handler
      btn.addEventListener('click', function(){ openSessionModal(mode); });
    } catch (e) { console.warn('appendSessionCTA', e); }
  }

  // Expose for external rebind calls
  window.openSession = openSessionModal;
  window.closeSession = closeSessionModal;

  // Hook into existing rebind function to append the CTA after route rendering
  var _origRenderRoute = window.renderRoute;
  if (typeof _origRenderRoute === 'function') {
    window.renderRoute = function(){
      try { _origRenderRoute(); } catch (e) { console.warn('renderRoute wrapper error', e); }
      // after render completes, check if we are on a mode page and append CTA
      try {
        var h = location.hash || '#home';
        if (h.indexOf('#mode/') === 0) {
          var mode = h.split('/')[1];
          appendSessionCTA(mode);
        } else if (h === '#quick') {
          appendSessionCTA('quick');
        }
      } catch (e) {}
    };
  }

  // Provide a rebind helper (if present) to re-attach CTAs if needed
  window.__rebindUI = window.__rebindUI || function(){ try { var h = location.hash || '#home'; if (h.indexOf('#mode/') === 0) appendSessionCTA(h.split('/')[1]); else if (h === '#quick') appendSessionCTA('quick'); } catch(e){} };

  // If the app was already initialized, run append for current route
  document.addEventListener('DOMContentLoaded', function(){
    try {
      var h = location.hash || '#home';
      if (h.indexOf('#mode/') === 0) appendSessionCTA(h.split('/')[1]);
      else if (h === '#quick') appendSessionCTA('quick');
    } catch (e) {}
  });

})();