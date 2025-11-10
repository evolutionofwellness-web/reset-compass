/* Intro controller & scroll-linked arrow rotation
   - Plays an intro: compass spins, scales, fades out to reveal UI.
   - Replay button triggers it again.
   - Respects prefers-reduced-motion.
   - Arrow rotation on scroll.
*/

(function(){
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const introId = 'cinematicIntro';
  let introPlayed = sessionStorage.getItem('introPlayed') === 'true';

  function buildIntroOverlay(){
    const overlay = document.createElement('div');
    overlay.id = introId;
    overlay.className = 'intro-wrap';
    overlay.innerHTML = `
      <div style="text-align:center;">
        <div class="compass" role="img" aria-label="Intro compass animation">
          <img src="assets/compass.svg" alt="" style="width:92%;height:92%;pointer-events:none;display:block;"/>
          <div class="arrow" aria-hidden="true"></div>
        </div>
        <div style="margin-top:18px;">
          <button id="replayIntro" class="btn" aria-label="Replay intro">Replay Intro</button>
          <button id="skipIntro" class="btn" style="margin-left:8px;background:transparent;border:1px solid rgba(255,255,255,0.08)">Skip</button>
        </div>
      </div>
    `;
    return overlay;
  }

  function playIntroOnce(){
    if(prefersReduced) return finishIntroImmediately();
    if(introPlayed) return finishIntroImmediately();
    const overlay = buildIntroOverlay();
    document.documentElement.appendChild(overlay);
    const compassEl = overlay.querySelector('.compass');

    // initial transform
    compassEl.style.transform = 'rotate(0deg) scale(.6)';

    // spin animation
    const spin = compassEl.animate([
      { transform: 'rotate(0deg) scale(.6)' },
      { transform: 'rotate(1080deg) scale(1.02)' }
    ], { duration: 1600, easing: 'cubic-bezier(.2,.9,.3,1)' });

    spin.onfinish = ()=>{
      overlay.classList.add('fade-in');
      overlay.animate([{opacity:1},{opacity:0}],{duration:520,delay:240,fill:'forwards'}).onfinish = () => {
        overlay.classList.add('intro-hidden');
        overlay.remove();
        sessionStorage.setItem('introPlayed','true');
      };
    };

    overlay.querySelector('#replayIntro').addEventListener('click', ()=>{
      playIntroOnceReset();
    });
    overlay.querySelector('#skipIntro').addEventListener('click', finishIntroImmediately);
  }

  function playIntroOnceReset(){
    sessionStorage.removeItem('introPlayed');
    introPlayed = false;
    playIntroOnce();
  }

  function finishIntroImmediately(){
    const existing = document.getElementById(introId);
    if(existing){ existing.remove(); sessionStorage.setItem('introPlayed','true'); }
  }

  // Arrow rotation on scroll (gentle)
  function hookArrowScroll(){
    const arrow = document.querySelector('.compass .arrow') || document.querySelector('.arrow');
    if(!arrow) return;
    window.addEventListener('scroll', ()=> {
      const sc = Math.min(Math.max(window.scrollY, 0), 500);
      const deg = (sc / 500) * 12; // up to 12 degrees
      arrow.style.transform = `rotate(${deg}deg)`;
    }, { passive: true });
  }

  // init
  document.addEventListener('DOMContentLoaded', ()=>{
    if(!prefersReduced && sessionStorage.getItem('introPlayed') !== 'true'){
      try { playIntroOnce(); } catch(e){ console.warn(e); }
    }
    hookArrowScroll();

    document.addEventListener('click', (e)=>{
      const t = e.target;
      if(t && (t.id === 'replayIntroGlobal' || (t.dataset && t.dataset.replayIntro === 'true'))){
        playIntroOnceReset();
      }
    });
  });

})();
