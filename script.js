// Small tweak: increase wedge visibility (alpha) so that labels inside the compass read better

(function() {
  'use strict';

  // --- State ---
  let modes = [];
  let currentMode = null;

  const HISTORY_KEY = 'resetCompassHistory';
  const THEME_KEY = 'resetCompassTheme';
  const INTRO_SEEN_KEY = 'resetCompassIntroSeen';
  const STREAK_KEY = 'resetCompassStreak';
  const LAST_DAY_KEY = 'resetCompassLastDay';
  const LONGEST_KEY = 'resetCompassLongest';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Quick wins mapping (keys are mode ids) ---
  const quickWinsMap = {
    3: [ 'Plant your feet and do a short stretch', 'Ground with deliberate breath: 4 4 4', 'Put away one distracting item', 'Drink a glass of water' ],
    2: [ 'Take 3 deep breaths', 'Name 3 things you notice around you', 'Lie down and relax for 2 minutes', 'Slow-release breathing for 1 minute' ],
    4: [ 'Try one small new challenge', 'Write a short reflection on progress', 'Do a 5-minute creative exercise', 'Send an encouraging message to someone' ],
    1: [ 'Take 3 quick breaths', 'Drink water', 'Set one tiny goal for the next hour', 'Stand up and move for 60 seconds' ]
  };

  // --- DOM refs ---
  const compassRing = document.getElementById('compassRing');
  const compassWedges = document.getElementById('compassWedges');

  // other DOM refs omitted for brevity; they remain unchanged in the repo versions

  // --- Render compass ring (wedge alpha increased slightly for readability) ---
  function renderCompassRing() {
    if (!compassRing) return;
    compassRing.innerHTML = '';

    const chosen = getPreferredRingModes();
    buildWedges(chosen);

    const portion = 360 / (chosen.length || 4);

    chosen.forEach((mode, idx) => {
      if (!mode) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ring-btn`;
      btn.dataset.modeId = mode.id;
      btn.setAttribute('aria-label', `${mode.name} mode`);
      const centerAngle = Math.round(((idx + 0.5) * portion) - 45);
      btn.style.setProperty('--angle', `${centerAngle}deg`);
      btn.innerHTML = `<span class="ring-label">${escapeHtml(mode.name)}</span>`;
      const base = mode.color || '#00AFA0';
      // use slightly stronger alpha so wedge colors read behind labels
      const bg = /^#([A-Fa-f0-9]{6})$/.test(base) ? `${base}66` : `${base}66`;
      btn.style.background = `linear-gradient(180deg, ${bg}, rgba(0,0,0,0.08))`;
      btn.style.setProperty('--mode-color', base);
      btn.style.color = getContrastColor(base);
      compassRing.appendChild(btn);
    });
  }

  function buildWedges(chosenModes) {
    if (!compassWedges) return;
    const N = chosenModes.length || 0;
    if (N === 0) { compassWedges.style.background = 'transparent'; return; }
    const portion = 360 / N;
    const entries = chosenModes.map((m, i) => {
      const color = (m && m.color) ? m.color : '#00AFA0';
      // stronger wedge alpha
      const stopColor = /^#([A-Fa-f0-9]{6})$/.test(color) ? color + '66' : color;
      const start = Math.round(i * portion);
      const end = Math.round((i + 1) * portion);
      return `${stopColor} ${start}deg ${end}deg`;
    });
    compassWedges.style.background = `conic-gradient(from -45deg, ${entries.join(',')})`;
  }

  // --- Utility stubs to avoid breaking the file when pasted as-is; full implementations already exist in repo ---
  function getPreferredRingModes(){ try{ return window.__preferredRingModes || []; }catch(e){return [];} }
  function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
  function getContrastColor(hex){
    if(!hex) return '#fff';
    const h = hex.replace('#','').trim();
    const r = parseInt(h.length===3? h[0]+h[0] : h.slice(0,2),16);
    const g = parseInt(h.length===3? h[1]+h[1] : h.slice(h.length===3?1:2, h.length===3?2:4),16);
    const b = parseInt(h.length===3? h[2]+h[2] : h.slice(h.length===3?2:4, h.length),16);
    const luminance = (0.299*r + 0.587*g + 0.114*b);
    return luminance > 186 ? '#000' : '#fff';
  }

  // Export small functions for the rest of the app to call (if needed)
  window.__renderCompassRing = renderCompassRing;
  window.__buildWedges = buildWedges;

  // If the repo's main init calls renderCompassRing, it will now use these updated functions.

})();