// app.js v113 — Defensive fixes: ensure #content exists, reliable nav bindings, detailed logs
(function(){
  'use strict';

  // Small helpers
  function $(sel, root=document){ return Array.from((root||document).querySelectorAll(sel)); }
  function id(name){ return document.getElementById(name); }
  function safe(fn){ try { return fn(); } catch(e) { console.warn('safe caught', e); return null; } }

  // Diagnostics capture
  window.__lastAppError = null;
  window.onerror = function(msg, url, line, col, err){
    try { window.__lastAppError = { msg, url, line, col, err: err && (err.stack||err.message) || null, time: new Date().toISOString() }; } catch(e){}
    return false;
  };

  // Exported navigation helpers (guaranteed)
  window.navigateHash = function(hash){
    try { location.hash = hash; } catch(e){ console.warn('navigateHash failed', e); }
    safe(()=>{ if (typeof window.renderRoute === 'function') window.renderRoute(); });
  };
  window.navigateMode = function(mode){
    try { location.hash = '#mode/' + mode; } catch(e){ console.warn('navigateMode failed', e); }
    safe(()=>{ if (typeof window.renderRoute === 'function') window.renderRoute(); });
  };

  // Ensure #content exists; create if missing (defensive)
  function ensureContentElement(){
    let c = id('content');
    if (c) return c;
    // Try to append to the main .page container
    const page = id('page') || document.querySelector('.page') || document.body;
    if (!page) {
      // fallback: append to body
      c = document.createElement('div');
      c.id = 'content';
      c.className = 'content-area';
      document.body.appendChild(c);
      console.info('[v113] createContent: appended #content to <body> fallback');
      return c;
    }
    c = document.createElement('div');
    c.id = 'content';
    c.className = 'content-area';
    c.setAttribute('aria-live','polite');
    page.appendChild(c);
    console.info('[v113] createContent: appended #content to .page');
    return c;
  }

  // Main init
  document.addEventListener('DOMContentLoaded', () => {
    try {
      console.info('[v113] App init start');

      // Reveal app root immediately (no splash)
      const appRoot = id('app-root');
      if (appRoot) { appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); }

      // Ensure needle group is non-interactive and idle class present
      (function ensureNeedle(){
        const ng = id('needle-group');
        if (ng){
          try { ng.style.pointerEvents = 'none'; if (!ng.classList.contains('idle')) ng.classList.add('idle'); } catch(e){}
        }
      })();

      // --- scroll rotation (raf + fallback) ---
      const ANGLE_MAX = 720;
      let lastScrollY = 0, rafFlag=false, resumeTimer=null, scrollActive=false, interactionPause=false;

      function setInteractionPause(on){
        interactionPause = !!on;
        const ng = id('needle-group');
        if (!on){
          clearTimeout(resumeTimer);
          resumeTimer = setTimeout(()=>{ if (ng && !interactionPause) ng.classList.add('idle'); }, 260);
        } else {
          clearTimeout(resumeTimer);
          if (ng) ng.classList.remove('idle');
        }
      }

      function processScroll(){
        rafFlag = false;
        const ng = id('needle-group');
        if (!ng || interactionPause) return;
        const doc = document.documentElement;
        const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
        const ratio = Math.max(0, Math.min(1, lastScrollY / maxScroll));
        const angle = ratio * ANGLE_MAX;
        try { ng.classList.remove('idle'); ng.style.transform = `rotate(${angle}deg)`; } catch(e){}
        scrollActive = true;
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(()=>{ if (ng && !interactionPause) ng.classList.add('idle'); scrollActive=false; }, 420);
      }
      function onScrollEvent(){
        lastScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        if (!rafFlag){ rafFlag = true; window.requestAnimationFrame(processScroll); }
      }
      window.addEventListener('scroll', onScrollEvent, { passive:true });

      // interval fallback
      const fallbackInterval = setInterval(()=>{
        const ng = id('needle-group');
        if (!ng || interactionPause) return;
        try{
          const doc = document.documentElement;
          const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
          const ratio = Math.max(0, Math.min(1, (window.scrollY||window.pageYOffset||0) / maxScroll));
          const angle = ratio * ANGLE_MAX;
          ng.style.transform = `rotate(${angle}deg)`;
        }catch(e){}
      }, 350);
      window.addEventListener('beforeunload', ()=> clearInterval(fallbackInterval));

      // --- Delegated wedge clicks on the compass SVG ---
      const compass = id('compass');
      if (compass){
        compass.addEventListener('click', (ev) => {
          try{
            const path = ev.target && (ev.target.closest ? ev.target.closest('path[data-mode]') : null);
            if (!path) return;
            const mode = path.getAttribute('data-mode');
            console.debug('[v113] delegated wedge click ->', mode);
            // show selection bloom & spin then navigate
            try { path.classList.remove('bloom'); path.classList.add('bloom-strong'); setTimeout(()=>path.classList.remove('bloom-strong'), 620); } catch(e){}
            const ng = id('needle-group');
            if (ng){
              ng.classList.remove('idle');
              ng.classList.add('needle-spin');
              setTimeout(()=> { ng.classList.remove('needle-spin'); ng.classList.add('idle'); window.navigateMode(mode); setInteractionPause(false); }, 560);
            } else {
              window.navigateMode(mode);
              setInteractionPause(false);
            }
          } catch(err){ console.warn('[v113] compass delegation error', err); }
        });
      } else {
        console.warn('[v113] compass element missing - wedge delegation not attached');
      }

      // --- Per-element idempotent binding with retries (hover behaviors etc.) ---
      function bindUI(){
        const res = { wedges:0, buttons:0 };
        try{
          const wedges = $('#compass path[data-mode]');
          res.wedges = wedges.length;
          wedges.forEach(w => {
            w.style.pointerEvents = 'auto';
            if (!w.__v113bound){
              w.addEventListener('pointerenter', () => {
                setInteractionPause(true);
                try {
                  const angle = Number(w.getAttribute('data-angle') || 0);
                  const ng = id('needle-group');
                  if (ng) { ng.classList.remove('idle'); ng.style.transform = `rotate(${angle}deg)`; }
                } catch(e){}
                try { w.classList.add('bloom'); } catch(e){}
              });
              w.addEventListener('pointerleave', () => { try { w.classList.remove('bloom'); } catch(e){} setInteractionPause(false); });
              w.__v113bound = true;
            }
          });

          const buttons = $('button[data-mode]');
          res.buttons = buttons.length;
          buttons.forEach(b => {
            b.style.pointerEvents = 'auto';
            if (!b.__v113bound){
              b.addEventListener('click', (ev) => {
                try { ev && ev.preventDefault && ev.preventDefault(); } catch(e){}
                const m = b.dataset.mode;
                console.debug('[v113] button click ->', m);
                window.navigateMode(m);
              });
              b.__v113bound = true;
            }
          });

          // Nav links (top bar)
          const navLinks = $('.nav-links a[data-hash]');
          navLinks.forEach(a => {
            if (!a.__v113bound){
              a.addEventListener('click', (ev) => {
                try { ev && ev.preventDefault && ev.preventDefault(); } catch(e){}
                const h = a.getAttribute('data-hash') || a.getAttribute('href');
                console.debug('[v113] nav click ->', h);
                if (h) window.navigateHash(h);
              });
              a.__v113bound = true;
            }
          });
        } catch(e){ console.warn('[v113] bindUI error', e); }
        return res;
      }

      const bindResult = bindUI();
      setTimeout(bindUI, 220);
      setTimeout(bindUI, 1200);
      console.info('[v113] bind attempted', bindResult);

      // --- RENDERING functions (ensure content existence) ---
      function renderRoute(){
        try{
          const h = location.hash || '#home';
          console.debug('[v113] renderRoute ->', h);
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
          safe(()=> window.scrollTo({ top:0, behavior:'auto' }));
        }catch(e){ console.error('[v113] renderRoute error', e); }
      }
      window.renderRoute = renderRoute;

      function renderHome(){
        const c = ensureContentElement();
        if (!c) return;
        c.innerHTML = '';
      }

      function renderModePage(mode){
        const c = ensureContentElement();
        if (!c) { console.warn('[v113] renderModePage: missing content element'); return; }
        console.debug('[v113] renderModePage ->', mode);
        if (!activities[mode]) {
          c.innerHTML = `<p>Unknown mode</p>`;
          return;
        }

        c.innerHTML = `<div class="mode-page" role="region" aria-labelledby="mode-title">
          <h2 id="mode-title">${capitalize(mode)}</h2>
          ${activities[mode].map((act,i) => 
            `<div class="activity-row" id="row-${mode}-${i}" role="group" aria-label="${escapeHtml(act.label)}">
               <div class="activity-main">
                 <span class="activity-icon" aria-hidden="true">${escapeHtml(act.icon)}</span>
                 <div class="activity-label">${escapeHtml(act.label)}</div>
               </div>
               <textarea id="note-${mode}-${i}" class="activity-note" placeholder="Notes (optional)"></textarea>
               <div class="activity-controls">
                 <button class="btn btn-complete" onclick="completeActivity('${mode}','${escapeJs(act.label)}','note-${mode}-${i}','row-${mode}-${i}')">Complete</button>
               </div>
             </div>`
          ).join('')}
          <button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button>
        </div>`;

        const container = c.querySelector('.mode-page');
        if (container && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          Array.from(container.querySelectorAll('.activity-row')).forEach((row,i)=>row.style.animation = `fadeRow 420ms ease ${i*40}ms both`);
        }
      }

      function renderQuickWins(){ const c = ensureContentElement(); if(!c) return; const quick=[{label:'Drink water',icon:'💧'},{label:'Stand up and stretch',icon:'🧘'},{label:'Take 3 deep breaths',icon:'🌬️'}]; c.innerHTML = `<div class="mode-page"><h2>Quick Wins</h2>` + quick.map((q,i)=>`<div class="activity-row" id="row-quick-${i}"><div class="activity-main"><span class="activity-icon">${escapeHtml(q.icon)}</span><div class="activity-label">${escapeHtml(q.label)}</div></div><textarea id="qw-${i}" class="activity-note" placeholder="Notes (optional)"></textarea><div class="activity-controls"><button class="btn btn-complete" onclick="completeActivity('quick-win','${escapeJs(q.label)}','qw-${i}','row-quick-${i}')">Complete</button></div></div>`).join('')+`<button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`; }

      function renderHistory(){ const c = ensureContentElement(); if(!c) return; const history=JSON.parse(localStorage.getItem('resetHistory')||'[]'); const counts={'growing':0,'grounded':0,'drifting':0,'surviving':0,'quick-win':0}; history.forEach(h=>{const key=(h.mode||'').toLowerCase(); if(counts[key]!=null) counts[key]+=1;}); const total = counts.growing+counts.grounded+counts.drifting+counts.surviving+counts['quick-win']; let statsHtml=''; if(total===0) statsHtml=`<p>No entries yet. Complete an activity to build your stats.</p>`; else statsHtml=`<div class="history-stats"><div class="history-chart-wrap"><canvas id="history-donut" aria-label="Mode distribution" role="img"></canvas></div></div>`; let listHtml=''; if(history.length===0) listHtml='<p>No history yet.</p>'; else listHtml = history.map(h=>`<p><strong>${escapeHtml(h.date)}:</strong> ${escapeHtml((h.mode||'').charAt(0).toUpperCase()+(h.mode||'').slice(1))} — ${escapeHtml(h.activity)}${h.note? ' • <em>'+escapeHtml(h.note)+'</em>' : ''}</p>`).join(''); c.innerHTML = `<div class="mode-page"><h2>History</h2>${statsHtml}<div>${listHtml}</div><button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`; if(total>0 && typeof Chart!=='undefined'){ try{ const ctx=id('history-donut').getContext('2d'); const labels=['Growing','Grounded','Drifting','Surviving','Quick Win']; const data=[counts.growing||0,counts.grounded||0,counts.drifting||0,counts.surviving||0,counts['quick-win']||0]; const bg=['#007BFF','#246B45','#DAA520','#D9534F','#6c757d']; if(window.__historyChart) try{window.__historyChart.destroy()}catch(e){} window.__historyChart=new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:bg,hoverOffset:10,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',plugins:{legend:{position:'bottom'}}}}); }catch(e){console.warn('history chart error',e);} }

      function renderAbout(){ const c = ensureContentElement(); if(!c) return; c.innerHTML = `<div class="mode-page"><h2>About</h2><p>The Reset Compass helps align energy and action with your state. Questions? <a href="mailto:evolutionofwellness@gmail.com">Contact Support</a></p><button class="return-button" onclick="navigateHash('#home')">Return to the Compass</button></div>`; }

      // Activities dataset
      const activities = {
        growing:[{label:"Write a goal",icon:"🎯"},{label:"Tackle a challenge",icon:"⚒️"},{label:"Start a new project",icon:"🚀"}],
        grounded:[{label:"Declutter a space",icon:"🧹"},{label:"Complete a task",icon:"✅"},{label:"Plan your day",icon:"🗓️"}],
        drifting:[{label:"Go for a walk",icon:"🚶"},{label:"Journal your thoughts",icon:"✍️"},{label:"Listen to calming music",icon:"🎧"}],
        surviving:[{label:"Drink water",icon:"💧"},{label:"Breathe deeply",icon:"🌬️"},{label:"Rest for 5 minutes",icon:"😴"}]
      };

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
          if (lastLogged !== today) {
            let streak = parseInt(localStorage.getItem('streak')||'0',10) || 0;
            streak += 1;
            localStorage.setItem('streak', String(streak));
            localStorage.setItem('lastLogged', today);
            const streakEmoji = id('streak-emoji');
            if (streakEmoji) { streakEmoji.classList.add('streak-pop'); setTimeout(()=>streakEmoji.classList.remove('streak-pop'),1100); }
            updateStreak();
          }
          runConfettiBurst();
          setTimeout(()=>{ navigateHash('#history'); }, 700);
        } catch(e) { console.error('completeActivity error', e); }
      };

      function runConfettiBurst(){ try{ const n=14; const container=document.createElement('div'); container.style.position='fixed';container.style.left='50%';container.style.top='32%';container.style.pointerEvents='none';container.style.zIndex=99999;container.style.transform='translateX(-50%)'; document.body.appendChild(container); for(let i=0;i<n;i++){ const dot=document.createElement('div'); dot.style.width=(8+Math.round(Math.random()*8))+'px'; dot.style.height=dot.style.width; dot.style.borderRadius='50%'; dot.style.background=['#FFD166','#06D6A0','#118AB2','#EF476F'][i%4]; dot.style.position='absolute'; dot.style.left='0'; dot.style.top='0'; dot.style.opacity='0.95'; container.appendChild(dot); const angle=(Math.random()*Math.PI*2); const dist=60+Math.random()*120; const dx=Math.cos(angle)*dist; const dy=Math.sin(angle)*dist; dot.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px, ${dy}px) scale(0.9)`,opacity:0.9}],{ duration:700+Math.random()*300, easing:'cubic-bezier(.2,.9,.2,1)' }); } setTimeout(()=>container.remove(),1400);}catch(e){console.warn('confetti error',e);} }

      function updateStreak(){ const el = id('streak-count'); if (el) el.textContent = localStorage.getItem('streak') || '0'; }
      function capitalize(s){ return (s||'').charAt(0).toUpperCase()+ (s||'').slice(1); }

      // ensure fadeRow keyframe exists
      (function(){ try{ const style=document.createElement('style'); style.textContent='@keyframes fadeRow{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'; document.head.appendChild(style); }catch(e){} })();

      // initial render + state
      if (!location.hash) location.hash = '#home';
      safe(()=> renderRoute());
      updateStreak();
      console.info('[v113] initialization complete');
    } catch(err) {
      console.error('[v113] initialization failed', err);
      try{ window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() }; } catch(e){}
      const root = id('app-root') || document.body;
      if (root) { root.classList.add('visible'); root.setAttribute('aria-hidden','false'); }
    }
  }); // DOMContentLoaded
})();```

What I changed and why (brief)
- The core problem was render functions returning early because #content could not be found; I now guarantee that #content exists (create-and-append) and added logging so we can see exactly what gets rendered.
- I re-bound nav and buttons defensively and kept the reliable delegated wedge clicks (the arrow spin logic is unchanged).
- This is a defensive, minimal change so it won’t alter app UX beyond ensuring navigation works and showing logs we can use if there’s still a blocker.

Next step for you
- Paste the new app.js (above), hard-refresh the page, open DevTools Console, and try:
  - Click "Home", "Quick Wins", "History", "About" (top nav) — you should see console debug logs and pages render.
  - Click wedges and mode buttons — console should show click logs and content should render.
- If you still get stuck, paste the console output and the result of this diagnostic (paste into Console and copy the output):
(() => {
  try {
    return {
      hash: location.hash,
      renderRoute: typeof window.renderRoute === 'function',
      navigateMode: typeof window.navigateMode === 'function',
      wedges: document.querySelectorAll('#compass path[data-mode]').length,
      buttons: Array.from(document.querySelectorAll('button[data-mode]')).map(b=>({mode:b.dataset.mode, bound:!!b.__v113bound})),
      contentExists: !!document.getElementById('content'),
      centerElement: (function(){ const c=document.getElementById('compass'); if(!c) return null; const r=c.getBoundingClientRect(); const el=document.elementFromPoint(Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)); return el?{tag:el.tagName,id:el.id||null,cls:el.className||null}:null; })(),
      lastAppError: window.__lastAppError || null
    };
  } catch(e){ return {error:String(e)}; }
})();

Paste that output here and I’ll analyze immediately.