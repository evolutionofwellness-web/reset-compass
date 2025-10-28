// app.js v108 — robust binding + delegation to ensure wedges and buttons are clickable
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/"/g,'\\"'); }

window.__lastAppError = null;
window.onerror = function(msg,url,line,col,err){ try{ window.__lastAppError={msg,url,line,col,err:(err&&(err.stack||err.message))||null,time:new Date().toISOString()}; }catch(e){}; return false; };

document.addEventListener('DOMContentLoaded', () => {
  try {
    const appRoot = document.getElementById('app-root');
    const compass = document.getElementById('compass');
    const needleGroup = document.getElementById('needle-group');
    if (appRoot) { appRoot.classList.add('visible'); appRoot.setAttribute('aria-hidden','false'); }
    if (needleGroup) { needleGroup.style.pointerEvents = 'none'; if (!needleGroup.classList.contains('idle')) needleGroup.classList.add('idle'); }

    // Delegated click handler on SVG container (works even if individual handlers fail)
    if (compass) {
      compass.addEventListener('click', (e) => {
        try {
          const path = e.target && (e.target.closest ? e.target.closest('path[data-mode]') : null);
          if (path) {
            const mode = path.getAttribute('data-mode');
            console.debug('delegated wedge click ->', mode);
            navigateMode(mode);
          }
        } catch (err) { console.warn('delegated click error', err); }
      });
    }

    // Defensive bind with retry for per-element handlers and diagnostics
    function bindHandlersOnce() {
      try {
        const wedges = Array.from(document.querySelectorAll('#compass path[data-mode]'));
        console.debug('bind attempt: wedges found', wedges.length);
        wedges.forEach(w => {
          // ensure pointer events are enabled
          w.style.pointerEvents = 'auto';
          // attach lightweight handlers (idempotent)
          if (!w.__bound) {
            w.addEventListener('click', (ev) => {
              try { ev.preventDefault(); } catch(e){}
              console.debug('wedge direct click ->', w.dataset.mode);
              navigateMode(w.dataset.mode);
            });
            w.__bound = true;
          }
        });

        const buttons = Array.from(document.querySelectorAll('button[data-mode]'));
        console.debug('bind attempt: buttons found', buttons.length);
        buttons.forEach(b => {
          if (!b.__bound) {
            b.addEventListener('click', (ev) => {
              try { ev.preventDefault(); } catch(e){}
              console.debug('button click ->', b.dataset.mode);
              navigateMode(b.dataset.mode);
            });
            b.__bound = true;
          }
        });
        return { wedges: wedges.length, buttons: buttons.length };
      } catch(e) {
        console.warn('bindHandlersOnce error', e);
        return { error: String(e) };
      }
    }

    // Attempt binding immediately and retry a couple of times in case of timing race
    const bindResult = bindHandlersOnce();
    // additional retries in case DOM is still mutating (idempotent)
    setTimeout(bindHandlersOnce, 250);
    setTimeout(bindHandlersOnce, 1200);

    // scroll-driven rotation (unchanged)
    let lastScrollY=0, ticking=false, scrollActive=false, resumeTimer=null, interactionPause=false;
    function setInteractionPause(on){ interactionPause = !!on; if(!on){ clearTimeout(resumeTimer); resumeTimer = setTimeout(()=>{ if (!scrollActive && needleGroup) needleGroup.classList.add('idle'); },260); } else { clearTimeout(resumeTimer); if (needleGroup) needleGroup.classList.remove('idle'); } }
    function onScroll(){ lastScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0; if (!ticking) { window.requestAnimationFrame(processScroll); ticking = true; } }
    function processScroll(){ ticking=false; if (!needleGroup || interactionPause) return; const doc=document.documentElement; const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight); const ratio = Math.max(0, Math.min(1, lastScrollY / maxScroll)); const angle = ratio * 720; needleGroup.classList.remove('idle'); needleGroup.style.transform = `rotate(${angle}deg)`; scrollActive=true; clearTimeout(resumeTimer); resumeTimer = setTimeout(()=>{ if (needleGroup && !interactionPause) needleGroup.classList.add('idle'); scrollActive=false; },420); }
    window.addEventListener('scroll', onScroll, { passive:true });

    // start rendering / state (render functions present below)
    if (!location.hash) location.hash = '#home';
    renderRoute();
    updateStreak();

    console.info('App v108 initialized — binding attempted', bindResult);
  } catch (err) {
    console.error('Initialization error:', err);
    try { window.__lastAppError = { msg: err.message || String(err), stack: err.stack || null, time: new Date().toISOString() }; } catch(e){}
    const root = document.getElementById('app-root') || document.body;
    if (root) { root.classList.add('visible'); root.setAttribute('aria-hidden','false'); }
  }
});

/* --- rest of app (renderModePage, renderHistory, completeActivity, etc.) same as stable baseline --- */
/* (unchanged) */