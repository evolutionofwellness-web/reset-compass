// Updated script.js — improved mapping for compass ring + accessibility tweaks
(function() {
  'use strict';

  let modes = [];
  let currentMode = null;
  const HISTORY_KEY = 'resetCompassHistory';
  const INTRO_SEEN_KEY = 'resetCompassIntroSeen';

  // small quick-wins map (kept as-is)
  const quickWinsMap = {
    1: [ 'Take 3 deep breaths', 'Drink a glass of water', 'Step outside for 2 minutes', 'Set one tiny goal for today' ],
    2: [ "Write down 3 things you're grateful for", 'Take a 10-minute walk', 'Call or text a friend', 'Tidy one small space' ],
    3: [ 'Plan tomorrow evening', 'Do a 15-minute workout', 'Read for 20 minutes', 'Practice a new skill for 30 minutes' ],
    4: [ 'Set a challenging goal', 'Learn something new for 1 hour', 'Connect with a mentor', 'Celebrate a recent win' ]
  };

  const modesGrid = document.getElementById('modesGrid');
  const modeDialog = document.getElementById('modeDialog');
  const historyDialog = document.getElementById('historyDialog');
  const compassRing = document.getElementById('compassRing');
  const compassArrow = document.getElementById('compassArrow');
  const compassImage = document.getElementById('compassImage');
  const historyBtn = document.getElementById('historyBtn');
  const replayBtn = document.getElementById('replayBtn');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  async function init() {
    try {
      await loadModes();
      renderModes();
      renderCompassRing();
      setupEventListeners();
      if (!prefersReducedMotion) setupScrollAnimation();
      markIntroSeen();
    } catch (err) {
      console.error('Init failed', err);
      if (modesGrid) modesGrid.innerHTML = '<p class="no-js-message">Failed to load modes. Please refresh.</p>';
    }
  }

  async function loadModes() {
    const res = await fetch('data/modes.json');
    if (!res.ok) throw new Error('Modes load failed');
    modes = await res.json();
  }

  function renderModes() {
    if (!modesGrid) return;
    if (!Array.isArray(modes) || modes.length === 0) {
      modesGrid.innerHTML = '<p class="no-js-message">No modes available.</p>';
      return;
    }

    modesGrid.innerHTML = modes.map(mode => `
      <button class="mode-card" data-mode-id="${mode.id}" aria-label="Select ${mode.name} mode" style="border-color:${mode.color}22">
        <span class="mode-icon" aria-hidden="true">${mode.icon}</span>
        <div class="mode-meta">
          <div class="mode-name">${mode.name}</div>
          <div class="mode-desc">${mode.description}</div>
        </div>
      </button>
    `).join('');

    document.querySelectorAll('.mode-card').forEach(el => {
      el.addEventListener('click', () => openModeDialog(Number(el.dataset.modeId)));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModeDialog(Number(el.dataset.modeId)); }
      });
    });
  }

  // Compass ring mapping: place first up to 4 modes around the compass in logical order.
  function renderCompassRing() {
    if (!compassRing || !Array.isArray(modes)) return;
    compassRing.innerHTML = '';

    // Determine up to 4 modes to show. Prefer stable mapping when modes include known ids; otherwise use array order.
    const positions = ['top','right','bottom','left'];
    const chosen = [];

    // If mode IDs 4/2/1/3 exist, prefer that semantic mapping (keeps old behavior)
    const preferOrder = [4,2,1,3];
    const hasPrefer = preferOrder.every(id => modes.find(m=>m.id===id));
    if (hasPrefer) {
      preferOrder.forEach(id => chosen.push(modes.find(m=>m.id===id)));
    } else {
      // fallback: use first up to 4 modes
      for (let i=0;i<Math.min(4,modes.length);i++) chosen.push(modes[i]);
    }

    chosen.forEach((mode, idx) => {
      if (!mode) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `ring-btn ring-${positions[idx]}`;
      btn.setAttribute('aria-label', `${mode.name} mode`);
      btn.dataset.modeId = mode.id;
      btn.innerHTML = `<span class="ring-icon" aria-hidden="true">${mode.icon}</span><span class="ring-label">${mode.name}</span>`;
      // set accessible color cue
      btn.style.borderColor = mode.color + '33';
      btn.style.background = `linear-gradient(180deg, ${mode.color}18, rgba(0,0,0,0.04))`;
      btn.addEventListener('click', () => openModeDialog(mode.id));
      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModeDialog(mode.id); }});
      compassRing.appendChild(btn);
    });
  }

  function openModeDialog(modeId) {
    const m = modes.find(x => x.id === Number(modeId));
    if (!m) return;
    currentMode = m;

    const iconEl = document.getElementById('dialogModeIcon');
    const titleEl = document.getElementById('modeDialogTitle');
    const descEl = document.getElementById('dialogModeDescription');
    const quoteEl = document.getElementById('dialogModeQuote');
    const quickWinsEl = document.getElementById('dialogQuickWins');

    if (iconEl) iconEl.textContent = m.icon;
    if (titleEl) titleEl.textContent = m.name;
    if (descEl) descEl.textContent = m.description;
    if (quoteEl) quoteEl.textContent = m.defaultQuote ? `"${m.defaultQuote}"` : '';

    const quickWins = quickWinsMap[m.id] || [];
    if (quickWinsEl) {
      quickWinsEl.innerHTML = quickWins.map(w => `<li><button class="quick-win-btn" data-win="${escapeHtml(w)}">${escapeHtml(w)}</button></li>`).join('');
      quickWinsEl.querySelectorAll('.quick-win-btn').forEach(b => b.addEventListener('click', e => startReset(e.currentTarget.dataset.win)));
    }

    if (typeof modeDialog.showModal === 'function') {
      modeDialog.showModal();
      const close = modeDialog.querySelector('.dialog-close');
      if (close) close.focus();
    } else {
      alert(`${m.name}\n\n${m.description}`);
    }
  }

  function startReset(selectedAction) {
    if (!currentMode) return;
    const action = selectedAction || (quickWinsMap[currentMode.id] && quickWinsMap[currentMode.id][0]) || 'No action selected';
    const history = getHistory();
    history.push({
      timestamp: new Date().toISOString(),
      modeId: currentMode.id,
      modeName: currentMode.name,
      modeIcon: currentMode.icon,
      modeColor: currentMode.color,
      action
    });
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) { console.warn(e) }
    try { if (modeDialog.close) modeDialog.close(); } catch(e){}
    showToast(`Saved: ${currentMode.name} — ${action}`);
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e){ return [] }
  }

  function openHistoryDialog() {
    const history = getHistory();
    const statsEl = document.getElementById('historyStats');
    const timelineEl = document.getElementById('historyTimeline');

    const modeStats = {};
    modes.forEach(m => modeStats[m.id] = { count:0, name: m.name, icon: m.icon, color: m.color });
    history.forEach(h => { if (modeStats[h.modeId]) modeStats[h.modeId].count++ });

    const total = history.length;
    statsEl.innerHTML = `<div class="stat-card"><span class="stat-value">${total}</span><span class="stat-label">Total Resets</span></div>` +
      modes.map(m => {
        const pct = total ? Math.round((modeStats[m.id].count/total)*100) : 0;
        return `<div class="stat-card"><span class="stat-value" style="color:${m.color}">${pct}%</span><span class="stat-label">${m.icon} ${m.name}</span></div>`;
      }).join('');

    timelineEl.innerHTML = history.length ? history.slice().reverse().map(entry => {
      const d = new Date(entry.timestamp);
      return `<div class="history-entry" style="border-left-color:${entry.modeColor}"><div class="history-entry-info"><div class="history-entry-mode"><span aria-hidden="true">${entry.modeIcon}</span>${escapeHtml(entry.modeName)}</div><div class="history-entry-time">${d.toLocaleString()}</div><div class="history-entry-action">${escapeHtml(entry.action)}</div></div></div>`;
    }).join('') : '<div class="empty-history">No reset history yet. Start your first reset!</div>';

    if (typeof historyDialog.showModal === 'function') historyDialog.showModal();
  }

  function exportHistory() {
    const data = JSON.stringify(getHistory(), null, 2);
    const blob = new Blob([data], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reset-compass-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function clearHistory() {
    if (!confirm('Clear all reset history? This cannot be undone.')) return;
    localStorage.removeItem(HISTORY_KEY);
    try { if (historyDialog.close) historyDialog.close(); } catch(e){}
    showToast('History cleared');
  }

  function showToast(text, ms = 1700) {
    const el = document.createElement('div');
    el.className = 'rc-toast';
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(()=> el.classList.add('visible'));
    setTimeout(()=>{ el.classList.remove('visible'); setTimeout(()=>el.remove(),240); }, ms);
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function setupEventListeners() {
    const startBtn = document.getElementById('startResetBtn');
    if (startBtn) startBtn.addEventListener('click', () => startReset());
    document.querySelectorAll('.dialog-close, .dialog-cancel').forEach(b => b.addEventListener('click', e => {
      const d = e.target.closest('dialog'); if (d) d.close();
    }));
    if (historyBtn) historyBtn.addEventListener('click', openHistoryDialog);
    const exportBtn = document.getElementById('exportHistoryBtn'); if (exportBtn) exportBtn.addEventListener('click', exportHistory);
    const clearBtn = document.getElementById('clearHistoryBtn'); if (clearBtn) clearBtn.addEventListener('click', clearHistory);
    if (replayBtn) replayBtn.addEventListener('click', () => {
      if (prefersReducedMotion) showToast('Animations disabled (reduced motion).');
      else { if (compassImage) { compassImage.style.transform = 'scale(0.98)'; setTimeout(()=>compassImage.style.transform = '', 220); } }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { try{ if (modeDialog.open) modeDialog.close(); }catch{} try{ if (historyDialog.open) historyDialog.close(); }catch{} }
    });
  }

  function setupScrollAnimation() {
    if (!compassArrow || prefersReducedMotion) return;
    let ticking = false;
    function update(){
      const scrollY = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? scrollY / max : 0;
      const rot = pct * 360;
      compassArrow.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
      ticking = false;
    }
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, {passive:true});
  }

  function markIntroSeen(){ if (!localStorage.getItem(INTRO_SEEN_KEY)) localStorage.setItem(INTRO_SEEN_KEY, '1'); }

  // Kick off
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
