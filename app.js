// app.js v102 — minor adjustments coordinated with splash & label improvements
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/"/g,'\\"'); }
window.__lastAppError = null;
window.onerror = function(msg,url,line,col,err){ try{ window.__lastAppError={msg,url,line,col,err:(err&&(err.stack||err.message))||null,time:new Date().toISOString()}; }catch(e){}; return false; };

document.addEventListener('DOMContentLoaded', () => {
  try {
    const splash = document.getElementById('splash-screen');
    const splashIcon = document.getElementById('splash-icon');
    const appRoot = document.getElementById('app-root');
    const needleGroup = document.getElementById('needle-group');

    if (appRoot){ appRoot.classList.remove('visible'); appRoot.setAttribute('aria-hidden','true'); }
    if (needleGroup && !needleGroup.classList.contains('idle')) needleGroup.classList.add('idle');

    // Smooth reveal: zoom more, ensure clean crossfade
    function revealAppOnce(){
      if (!appRoot) return;
      if (splash) splash.classList.add('hidden'); // start splash fade
      // small delay to create overlap (splash fading out while app fades in)
      setTimeout(()=> { appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); }, 60);
      // remove splash after its transition completes (or after a safety timeout)
      setTimeout(()=>{ try{ if (splash && splash.parentNode) splash.parentNode.removeChild(splash); }catch(e){} }, 780);
    }
    if (splash && splashIcon && appRoot){
      let called = false;
      const doReveal = () => { if (called) return; called = true; revealAppOnce(); };
      try { splashIcon.addEventListener('animationend', doReveal, { once: true }); } catch(e){}
      // fallback -->
      setTimeout(doReveal, 3000);
      // ensure removal when splash transition ends
      splash.addEventListener('transitionend', (ev)=>{ if (ev.propertyName === 'opacity' && splash.parentNode) try{ splash.parentNode.removeChild(splash); }catch(e){} }, { once:true });
    } else {
      if (appRoot){ appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); }
      if (splash && splash.parentNode) try{ splash.parentNode.removeChild(splash); }catch(e){}
    }

    // Wiring (nav/buttons/compass) - unchanged logic except for scroll-driven rotation controls
    document.querySelectorAll('.nav-links a[data-hash]').forEach(a=>a.addEventListener('click',(e)=>{ e.preventDefault(); const h=a.getAttribute('data-hash')||a.getAttribute('href'); if(h) navigateHash(h); }));

    document.getElementById('mode-buttons')?.addEventListener('click', (e)=> {
      const btn = e.target.closest && e.target.closest('button[data-mode]');
      if (btn){ const mode = btn.getAttribute('data-mode'); if (mode) navigateMode(mode); }
    });

    // set up scroll-driven rotation (0..720deg) with interaction pause
    const compass = document.getElementById('compass');
    const needle = document.getElementById('compass-needle');
    let lastScrollY = 0, ticking = false, scrollActive = false, resumeTimer = null, interactionPause = false;
    function setInteractionPause(on){ interactionPause = !!on; if (!on){ clearTimeout(resumeTimer); resumeTimer = setTimeout(()=>{ if (!scrollActive && needleGroup) needleGroup.classList.add('idle'); }, 260); } else { clearTimeout(resumeTimer); if (needleGroup) needleGroup.classList.remove('idle'); } }

    function onScroll(){ lastScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0; if(!ticking){ window.requestAnimationFrame(processScroll); ticking=true; } }
    function processScroll(){ ticking=false; if(!needleGroup || interactionPause) return; const doc=document.documentElement; const max = Math.max(1, doc.scrollHeight - window.innerHeight); const ratio = Math.max(0, Math.min(1, lastScrollY / max)); const angle = ratio * 720; needleGroup.classList.remove('idle'); needleGroup.style.transform = `rotate(${angle}deg)`; scrollActive=true; clearTimeout(resumeTimer); resumeTimer = setTimeout(()=>{ if (needleGroup && !interactionPause) needleGroup.classList.add('idle'); scrollActive=false; }, 420); }
    window.addEventListener('scroll', onScroll, { passive:true });

    // wedge interactions (pause scroll-driven rotation while interacting)
    if (compass && needle){
      document.querySelectorAll('#compass path[data-mode]').forEach(p=>{
        const angle = Number(p.getAttribute('data-angle')||0);
        p.addEventListener('pointerenter', ()=>{ setInteractionPause(true); if (needleGroup) needleGroup.classList.remove('idle'); needleGroup.style.transform = `rotate(${angle}deg)`; p.classList.add('bloom'); });
        p.addEventListener('pointerleave', ()=>{ p.classList.remove('bloom'); setInteractionPause(false); clearTimeout(resumeTimer); resumeTimer=setTimeout(()=>{ if(!scrollActive && needleGroup) needleGroup.classList.add('idle'); }, 260); });
        p.addEventListener('pointerdown', (e)=>{ e.preventDefault(); setInteractionPause(true); if (needleGroup) needleGroup.classList.remove('idle'); needleGroup.style.transform = `rotate(${angle}deg)`; p.classList.add('bloom'); }, {passive:false});
        p.addEventListener('click', (e)=>{ e.preventDefault(); p.classList.remove('bloom'); p.classList.add('bloom-strong'); if (needleGroup){ needleGroup.classList.remove('idle'); needleGroup.classList.add('needle-spin'); setTimeout(()=>{ needleGroup.classList.remove('needle-spin'); needleGroup.classList.add('idle'); p.classList.remove('bloom-strong'); const mode=p.getAttribute('data-mode'); if(mode) navigateMode(mode); setInteractionPause(false); },560); } else { const mode=p.getAttribute('data-mode'); if(mode) navigateMode(mode); setInteractionPause(false); } });
        p.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); const mode=p.getAttribute('data-mode'); if(mode) navigateMode(mode); } });
      });
    }

    // pointer heuristics for tap activation
    if (compass){
      let pointerState = null;
      compass.addEventListener('pointerdown', (e)=>{ if(e.isPrimary===false) return; const path = e.target && e.target.closest ? e.target.closest('path[data-mode]') : null; if(path) pointerState={id:e.pointerId,x:e.clientX,y:e.clientY,t:Date.now(),target:path}; }, {passive:true});
      compass.addEventListener('pointermove', (e)=>{ if(!pointerState||pointerState.id!==e.pointerId) return; const dx=e.clientX-pointerState.x, dy=e.clientY-pointerState.y; if(dx*dx+dy*dy>28*28) pointerState=null; }, {passive:true});
      compass.addEventListener('pointerup', (e)=>{ if(!pointerState||pointerState.id!==e.pointerId){ pointerState=null; return; } if(Date.now()-pointerState.t<700){ const mode=pointerState.target.getAttribute('data-mode'); if(mode) navigateMode(mode); } pointerState=null; }, {passive:true});
      compass.addEventListener('pointercancel', ()=>pointerState=null);
    }

    document.querySelectorAll('#compass path[data-mode]').forEach(p=>p.setAttribute('tabindex','0'));

    // routing + initialization
    renderRoute();
    updateStreak();
  } catch(err){
    console.error('Initialization error:', err);
    const appRoot = document.getElementById('app-root') || document.body; if (appRoot){ appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); }
    try{ const splash=document.getElementById('splash-screen'); if(splash && splash.parentNode) splash.parentNode.removeChild(splash); }catch(e){}
  }
});

/* The remainder of render/behavior functions are same as earlier stable baseline.
   They are long; keep them identical to the v25 stable implementations:
   - activities data
   - renderHome, renderModePage, renderQuickWins, renderHistory, renderAbout
   - completeActivity, runConfettiBurst, updateStreak, etc.
   (If you'd like, I can paste the full rest of the file here precisely as in your baseline.)
*/