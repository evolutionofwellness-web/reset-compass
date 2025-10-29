// app.js v113 (clean, defensive, synchronized UX)
// - Reliable bindings for nav, mode buttons and wedge clicks
// - Scroll-driven needle rotation: top -> bottom = 0 -> 720deg
// - Needle group non-interactive (won't block clicks)
// - Ensures #content exists and render functions always run
// - Minimal console diagnostics (remove if you prefer quiet)

// Small helpers
function $(sel, root = document){ return Array.from((root || document).querySelectorAll(sel)); }
function id(name){ return document.getElementById(name); }
function safe(fn){ try { return fn(); } catch(e) { console.warn('safe caught', e); return null; } }

// Diagnostic capture
window.__lastAppError = null;
window.onerror = function(msg,url,line,col,err){
  try{ window.__lastAppError = { msg, url, line, col, err: err && (err.stack||err.message) || null, time: new Date().toISOString() }; } catch(e){}
  return false;
};

// Ensure #content exists (create & append if missing)
function ensureContentElement(){
  let c = id('content');
  if (c) return c;
  const page = id('page') || document.querySelector('.page') || document.body;
  c = document.createElement('div');
  c.id = 'content';
  c.className = 'content-area';
  c.setAttribute('aria-live','polite');
  page.appendChild(c);
  console.info('[app] created #content fallback');
  return c;
}

// Expose navigation helpers
window.navigateHash = function(hash){
  try{ location.hash = hash; } catch(e){ console.warn('navigateHash failed', e); }
  safe(()=>{ if (typeof window.renderRoute === 'function') window.renderRoute(); });
};
window.navigateMode = function(mode){
  try{ location.hash = '#mode/' + mode; } catch(e){ console.warn('navigateMode failed', e); }
  safe(()=>{ if (typeof window.renderRoute === 'function') window.renderRoute(); });
};

// DOM ready initialization
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.info('[app] initializing');

    // Reveal app root
    const appRoot = id('app-root');
    if (appRoot){ appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); }

    // Ensure needle non-interactive
    const needleGroup = id('needle-group');
    if (needleGroup){ needleGroup.style.pointerEvents = 'none'; if (!needleGroup.classList.contains('idle')) needleGroup.classList.add('idle'); }

    // Scroll-driven needle rotation (RAF + fallback)
    const ANGLE_MAX = 720;
    let lastScrollY = 0, rafQueued = false, resumeTimer = null, scrollActive = false, interactionPause = false;
    function setInteractionPause(on){
      interactionPause = !!on;
      if (!on){
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(()=>{ if (needleGroup && !interactionPause) needleGroup.classList.add('idle'); }, 260);
      } else {
        clearTimeout(resumeTimer);
        if (needleGroup) needleGroup.classList.remove('idle');
      }
    }
    function processScroll(){
      rafQueued = false;
      if (!needleGroup || interactionPause) return;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      const ratio = Math.max(0, Math.min(1, lastScrollY / maxScroll));
      const angle = ratio * ANGLE_MAX;
      try { needleGroup.classList.remove('idle'); needleGroup.style.transform = `rotate(${angle}deg)`; } catch(e){}
      scrollActive = true;
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(()=>{ if (needleGroup && !interactionPause) needleGroup.classList.add('idle'); scrollActive = false; }, 420);
    }
    function onScroll(){ lastScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0; if (!rafQueued){ rafQueued = true; window.requestAnimationFrame(processScroll); } }
    window.addEventListener('scroll', onScroll, { passive:true });
    // fallback interval
    const fallbackInterval = setInterval(()=>{ if (!needleGroup || interactionPause) return; try { const doc=document.documentElement; const maxScroll=Math.max(1, doc.scrollHeight - window.innerHeight); const ratio=Math.max(0, Math.min(1, (window.scrollY||window.pageYOffset||0)/maxScroll)); const angle=ratio*ANGLE_MAX; needleGroup.style.transform = `rotate(${angle}deg)`; } catch(e){} }, 350);
    window.addEventListener('beforeunload', ()=>clearInterval(fallbackInterval));

    // Delegated wedge click (reliable)
    const compass = id('compass');
    if (compass){
      compass.addEventListener('click', (ev)=>{
        try{
          const path = ev.target && (ev.target.closest ? ev.target.closest('path[data-mode]') : null);
          if (!path) return;
          const mode = path.getAttribute('data-mode');
          console.debug('[app] wedge click ->', mode);
          // bloom then spin
          try { path.classList.remove('bloom'); path.classList.add('bloom-strong'); setTimeout(()=>path.classList.remove('bloom-strong'), 620); } catch(e){}
          if (needleGroup){
            needleGroup.classList.remove('idle');
            needleGroup.classList.add('needle-spin');
            setTimeout(()=>{ needleGroup.classList.remove('needle-spin'); needleGroup.classList.add('idle'); navigateMode(mode); setInteractionPause(false); }, 560);
          } else {
            navigateMode(mode);
            setInteractionPause(false);
          }
        }catch(e){ console.warn('[app] delegated wedge click error', e); }
      });
    } else {
      console.warn('[app] #compass not present for delegation');
    }

    // Idempotent per-element UI bindings + nav links
    function bindUI(){
      try{
        const wedges = $('#compass path[data-mode]');
        wedges.forEach(w=>{
          w.style.pointerEvents = 'auto';
          if (!w.__bound_v113){
            w.addEventListener('pointerenter', ()=>{
              setInteractionPause(true);
              try { const angle = Number(w.getAttribute('data-angle') || 0); if (needleGroup){ needleGroup.classList.remove('idle'); needleGroup.style.transform = `rotate(${angle}deg)`; } } catch(e){}
              try { w.classList.add('bloom'); } catch(e){}
            });
            w.addEventListener('pointerleave', ()=>{ try{ w.classList.remove('bloom'); }catch(e){} setInteractionPause(false); });
            w.__bound_v113 = true;
          }
        });

        const buttons = $('button[data-mode]');
        buttons.forEach(b=>{
          b.style.pointerEvents = 'auto';
          if (!b.__bound_v113){
            b.addEventListener('click', (ev)=>{ try{ ev && ev.preventDefault && ev.preventDefault(); } catch(e){} const m = b.dataset.mode; console.debug('[app] button click ->', m); navigateMode(m); });
            b.__bound_v113 = true;
          }
        });

        const navLinks = $('.nav-links a[data-hash]');
        navLinks.forEach(a=>{
          a.style.pointerEvents = 'auto';
          if (!a.__bound_v113){
            a.addEventListener('click', (ev)=>{ try{ ev && ev.preventDefault && ev.preventDefault(); } catch(e){} const h = a.getAttribute('data-hash') || a.getAttribute('href'); console.debug('[app] nav click ->', h); if (h) navigateHash(h); });
            a.__bound_v113 = true;
          }
        });
        return { wedges: wedges.length, buttons: buttons.length, nav: navLinks.length };
      } catch(e){ console.warn('[app] bindUI failed', e); return { error: String(e) }; }
    }
    const bindResult = bindUI();
    setTimeout(bindUI, 200);
    setTimeout(bindUI, 1200);
    console.info('[app] bind attempted', bindResult);

    // Renders (ensure content)
    function renderRoute(){
      try{
        const h = location.hash || '#home';
        console.debug('[app] renderRoute ->', h);
        const isFull = h !== '#home';
        const compassContainer = id('compass-container'), modeButtons = id('mode-buttons'), howTo = id('how-to');
        if (compassContainer) compassContainer.style.display = isFull ? 'none' : '';
        if (modeButtons) modeButtons.style.display = isFull ? 'none' : '';
        if (howTo) howTo.style.display = isFull ? 'none' : '';
        if (h.startsWith('#mode/')) renderModePage(h.split('/')[1]);
        else if (h === '#quick') renderQuickWins();
        else if (h === '#history') renderHistory();
        else if (h === '#about') renderAbout();
        else renderHome();
        safe(()=>window.scrollTo({top:0,behavior:'auto'}));
      } catch(e){ console.error('[app] renderRoute error', e); }
    }
    window.renderRoute = renderRoute;

    function renderHome(){ const c = ensureContentElement(); c.innerHTML = ''; }
    function renderModePage(mode){
      const c = ensureContentElement();
      console.debug('[app] renderModePage ->', mode, 'contentExists=', !!c);
      if (!activities[mode]) { c.innerHTML = `<p>Unknown mode</p>`; return; }
      c.innerHTML = `<div class="mode-page" role="region" aria-labelledby="mode-title"><h2 id="mode-title">${capitalize(mode)}</h2>` +
        activities[mode].map((act,i)=>`<div class="activity-row" id="row-${mode}-${i}"><div class="activity-main"><span class="activity-icon" aria-hidden="true">${escapeHtml(act.icon)}</span><div class="activity-label">${escapeHtml(act.label)}</div></div><textarea id="note-${mode}-${i}" class="activity-note" placeholder="Notes (optional)"></textarea><div class="activity-controls"><button class="btn btn-complete" onclick="completeActivity('${mode}','${escapeJs(act.label)}','note-${mode}-${i}','row-${mode}-${i}')">Complete</button></div></div>`).join('') +
        `<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`;
      const container = c.querySelector('.mode-page');
      if (container && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) Array.from(container.querySelectorAll('.activity-row')).forEach((row,i)=>row.style.animation=`fadeRow 420ms ease ${i*40}ms both`);
    }
    function renderQuickWins(){ const c=ensureContentElement(); const quick=[{label:'Drink water',icon:'💧'},{label:'Stand up and stretch',icon:'🧘'},{label:'Take 3 deep breaths',icon:'🌬️'}]; c.innerHTML = `<div class="mode-page"><h2>Quick Wins</h2>`+quick.map((q,i)=>`<div class="activity-row" id="row-quick-${i}"><div class="activity-main"><span class="activity-icon">${escapeHtml(q.icon)}</span><div class="activity-label">${escapeHtml(q.label)}</div></div><textarea id="qw-${i}" class="activity-note" placeholder="Notes (optional)"></textarea><div class="activity-controls"><button class="btn btn-complete" onclick="completeActivity('quick-win','${escapeJs(q.label)}','qw-${i}','row-quick-${i}')">Complete</button></div></div>`).join('')+`<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`; }
    function renderHistory(){ const c=ensureContentElement(); const history=JSON.parse(localStorage.getItem('resetHistory')||'[]'); const counts={'growing':0,'grounded':0,'drifting':0,'surviving':0,'quick-win':0}; history.forEach(h=>{const k=(h.mode||'').toLowerCase(); if(counts[k]!=null) counts[k]+=1}); const total=counts.growing+counts.grounded+counts.drifting+counts.surviving+counts['quick-win']; let stats=''; if(total===0) stats='<p>No entries yet. Complete an activity to build your stats.</p>'; else stats=`<div class="history-stats"><div class="history-chart-wrap"><canvas id="history-donut" aria-label="Mode distribution" role="img"></canvas></div></div>`; let list=''; if(history.length===0) list='<p>No history yet.</p>'; else list = history.map(h=>`<p><strong>${escapeHtml(h.date)}:</strong> ${escapeHtml((h.mode||'').charAt(0).toUpperCase()+(h.mode||'').slice(1))} — ${escapeHtml(h.activity)}${h.note? ' • <em>'+escapeHtml(h.note)+'</em>':''}</p>`).join(''); c.innerHTML = `<div class="mode-page"><h2>History</h2>${stats}<div>${list}</div><button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`; if(total>0 && typeof Chart!=='undefined'){ try{ const ctx=id('history-donut').getContext('2d'); const labels=['Growing','Grounded','Drifting','Surviving','Quick Win']; const data=[counts.growing||0,counts.grounded||0,counts.drifting||0,counts.surviving||0,counts['quick-win']||0]; const bg=['#007BFF','#246B45','#DAA520','#D9534F','#6c757d']; if(window.__historyChart) try{window.__historyChart.destroy()}catch(e){} window.__historyChart = new Chart(ctx,{ type:'doughnut', data:{ labels, datasets:[{ data, backgroundColor:bg, hoverOffset:10, borderWidth:0 }]}, options:{ responsive:true, maintainAspectRatio:false, cutout:'65%', plugins:{ legend:{ position:'bottom' } } } }); }catch(e){console.warn('history chart error',e);} }
    function renderAbout(){ const c=ensureContentElement(); c.innerHTML=`<div class="mode-page"><h2>About</h2><p>The Reset Compass helps align energy and action with your state. Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p><button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`; }

    // Activities dataset
    const activities = { growing:[{label:"Write a goal",icon:"🎯"},{label:"Tackle a challenge",icon:"⚒️"},{label:"Start a new project",icon:"🚀"}], grounded:[{label:"Declutter a space",icon:"🧹"},{label:"Complete a task",icon:"✅"},{label:"Plan your day",icon:"🗓️"}], drifting:[{label:"Go for a walk",icon:"🚶"},{label:"Journal your thoughts",icon:"✍️"},{label:"Listen to calming music",icon:"🎧"}], surviving:[{label:"Drink water",icon:"💧"},{label:"Breathe deeply",icon:"🌬️"},{label:"Rest for 5 minutes",icon:"😴"}] };

    // completeActivity (global)
    window.completeActivity = function(mode, activity, noteId, rowId){
      try{
        const row = id(rowId);
        if (row) { row.classList.add('activity-complete-pop'); setTimeout(()=>row.classList.remove('activity-complete-pop'),700); }
        const note = noteId ? (document.getElementById(noteId)?.value || "") : "";
        const date = new Date().toLocaleDateString();
        const normalizedMode = (mode === 'quick' || mode === 'quick-win') ? 'quick-win' : mode;
        const entry = { date, mode: normalizedMode, activity, note };
        let history = JSON.parse(localStorage.getItem('resetHistory')||'[]');
        history.unshift(entry);
        localStorage.setItem('resetHistory', JSON.stringify(history));
        const lastLogged = localStorage.getItem('lastLogged');
        const today = new Date().toLocaleDateString();
        if (lastLogged !== today){
          let streak = parseInt(localStorage.getItem('streak')||'0',10) || 0;
          streak += 1;
          localStorage.setItem('streak', String(streak));
          localStorage.setItem('lastLogged', today);
          const streakEmoji = id('streak-emoji');
          if (streakEmoji){ streakEmoji.classList.add('streak-pop'); setTimeout(()=>streakEmoji.classList.remove('streak-pop'),1100); }
          updateStreak();
        }
        runConfettiBurst();
        setTimeout(()=>{ navigateHash('#history'); },700);
      } catch(e){ console.error('completeActivity error', e); }
    };

    function runConfettiBurst(){ try{ const n=14; const container=document.createElement('div'); container.style.position='fixed';container.style.left='50%';container.style.top='32%';container.style.pointerEvents='none';container.style.zIndex=99999;container.style.transform='translateX(-50%)'; document.body.appendChild(container); for(let i=0;i<n;i++){ const dot=document.createElement('div'); dot.style.width=(8+Math.round(Math.random()*8))+'px'; dot.style.height=dot.style.width; dot.style.borderRadius='50%'; dot.style.background=['#FFD166','#06D6A0','#118AB2','#EF476F'][i%4]; dot.style.position='absolute'; dot.style.left='0'; dot.style.top='0'; dot.style.opacity='0.95'; container.appendChild(dot); const angle=(Math.random()*Math.PI*2); const dist=60+Math.random()*120; const dx=Math.cos(angle)*dist; const dy=Math.sin(angle)*dist; dot.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px, ${dy}px) scale(0.9)`,opacity:0.9}],{ duration:700+Math.random()*300, easing:'cubic-bezier(.2,.9,.2,1)' }); } setTimeout(()=>container.remove(),1400);}catch(e){console.warn('confetti error',e);} }

    function updateStreak(){ const el = id('streak-count'); if (el) el.textContent = localStorage.getItem('streak') || '0'; }
    function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
    function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/"/g,'\\"'); }
    function capitalize(s){ return (s||'').charAt(0).toUpperCase() + (s||'').slice(1); }

    // ensure fadeRow keyframe exists
    (function(){ try{ const st = document.createElement('style'); st.textContent='@keyframes fadeRow{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'; document.head.appendChild(st); } catch(e){} })();

    // initial render + state
    if (!location.hash) location.hash = '#home';
    safe(()=> renderRoute());
    updateStreak();

    console.info('[app] initialization complete (v113)');
  } catch(err){
    console.error('[app] init failed', err);
    try{ window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() }; } catch(e){}
    const root = id('app-root') || document.body;
    if (root) { root.classList.add('visible'); root.setAttribute('aria-hidden','false'); }
  }
});