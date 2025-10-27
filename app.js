// app.js (patch)
// - Ensure needle is subtly spinning by default
// - Pause the idle spin while pointing to a wedge; resume afterwards
// - Keep spin-on-select behavior
// - No other behavior changes

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
function escapeJs(s){ return String(s||'').replace(/'/g,"\\'").replace(/\"/g,'\\"') }

document.addEventListener("DOMContentLoaded", () => {
  try {
    const splash = document.getElementById("splash-screen");
    const splashIcon = document.getElementById("splash-icon");
    const appRoot = document.getElementById("app-root");
    const needleGroup = document.getElementById("needle-group");

    // Reveal app as before (fallbacks handled in v28 patch)
    if (appRoot && !appRoot.classList.contains('visible')) {
      appRoot.classList.remove('visible');
      appRoot.setAttribute('aria-hidden','true');
    }

    // Ensure needle-group exists and is neutral
    if (needleGroup && !needleGroup.style.transform) needleGroup.style.transform = 'rotate(0deg)';

    // (splash fade-in/out logic unchanged from v28)...
    // [omitted here for brevity in this patch snippet — keep your v28 splash crossfade code]

    // --- Compass needle interactivity: always-subtle spin, pause when user interacts ---
    const compass = document.getElementById("compass");
    function findPathElement(el){ return el && el.closest ? el.closest('path[data-mode]') : null; }

    if (compass && needleGroup) {
      const wedges = Array.from(document.querySelectorAll('#compass path[data-mode]'));
      wedges.forEach(w => {
        const angle = Number(w.getAttribute('data-angle') || 0);

        // pointerenter -> pause idle spin, rotate needle to wedge
        w.addEventListener('pointerenter', () => {
          // pause the CSS idle animation so the JS rotation is clear
          needleGroup.style.animationPlayState = 'paused';
          // rotate the needle to the wedge angle (CSS transition will animate)
          needleGroup.style.transform = `rotate(${angle}deg)`;
          // light bloom
          w.classList.remove('bloom-strong');
          w.classList.add('bloom');
        });

        // pointerleave -> resume idle spin (and allow needle to return to neutral)
        w.addEventListener('pointerleave', () => {
          w.classList.remove('bloom');
          // animate needle back to neutral, then resume animation
          needleGroup.style.transform = `rotate(0deg)`;
          // small timeout to let the transition finish before resuming animation
          setTimeout(() => {
            needleGroup.style.animationPlayState = 'running';
          }, 260);
        });

        // pointerdown: immediate feedback on touch — pause animation & rotate
        w.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          needleGroup.style.animationPlayState = 'paused';
          needleGroup.style.transform = `rotate(${angle}deg)`;
          w.classList.add('bloom');
        }, {passive:false});

        // click: strong bloom + spin animation, then navigate
        w.addEventListener('click', (e) => {
          e.preventDefault();
          w.classList.remove('bloom');
          w.classList.add('bloom-strong');
          // run spin; while spinning ensure idle is paused
          needleGroup.style.animationPlayState = 'paused';
          needleGroup.classList.add('needle-spin');
          setTimeout(() => {
            needleGroup.classList.remove('needle-spin');
            needleGroup.style.transform = `rotate(0deg)`;
            // resume idle spin after settle
            needleGroup.style.animationPlayState = 'running';
            w.classList.remove('bloom-strong');
            const mode = w.getAttribute('data-mode');
            if (mode) navigateMode(mode);
          }, 560);
        });

        // keyboard activation
        w.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            w.classList.add('bloom-strong');
            needleGroup.style.animationPlayState = 'paused';
            needleGroup.classList.add('needle-spin');
            setTimeout(()=> {
              needleGroup.classList.remove('needle-spin');
              needleGroup.style.transform = `rotate(0deg)`;
              needleGroup.style.animationPlayState = 'running';
              w.classList.remove('bloom-strong');
              const mode = w.getAttribute('data-mode');
              if (mode) navigateMode(mode);
            }, 560);
          }
        });
      });
    }

    // rest of initialization (nav wiring, etc.) unchanged from v28...
    // ensure hash routing runs etc.
    if (!location.hash) location.hash = "#home";
    renderRoute();
    updateStreak();

  } catch(err) {
    console.error('Initialization error (needle + mode-page patch):', err);
    const appRootFail = document.getElementById("app-root");
    if (appRootFail) { appRootFail.classList.add('visible'); appRootFail.setAttribute('aria-hidden','false'); }
    const splashFail = document.getElementById("splash-screen");
    if (splashFail && splashFail.parentNode) try { splashFail.parentNode.removeChild(splashFail); } catch(e){}
  }
});

// Keep all other functions (rendering, history donut, completeActivity, confetti, etc.) unchanged.