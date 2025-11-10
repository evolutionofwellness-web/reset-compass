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
        <div class="compass" role="img" aria-label="Intro compass animation" style="position:relative;">
          <img src="assets/images/compass.svg" alt="" style="width:96%;height:96%;pointer-events:none;display:block;opacity:0.3;"/>
          <div class="arrow" aria-hidden="true" style="animation:arrowSpin 3s ease-in-out infinite;"></div>
        </div>
        <div style="margin-top:28px;animation:fadeIn 0.8s ease 1.2s both;">
          <h2 style="color:var(--glow-accent);margin:0 0 16px 0;font-size:1.8rem;text-shadow:0 0 24px rgba(0,230,166,0.6);">The Reset Compass</h2>
          <p style="color:var(--brand-contrast);margin:0 0 24px 0;opacity:0.85;">Find your wellness mode and reset</p>
          <button id="skipIntro" class="btn" style="margin-right:12px;">Get Started</button>
          <button id="replayIntro" class="btn" aria-label="Replay intro" style="background:rgba(255,255,255,0.05);box-shadow:0 4px 12px rgba(0,0,0,0.3);">Replay</button>
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
    const arrow = overlay.querySelector('.arrow');

    compassEl.style.transform = 'rotate(0deg) scale(.5)';
    compassEl.style.opacity = '0';

    const introSequence = compassEl.animate([
      { transform: 'rotate(0deg) scale(.5)', opacity: 0, filter: 'blur(8px)' },
      { transform: 'rotate(720deg) scale(1.1)', opacity: 1, filter: 'blur(0px)', offset: 0.6 },
      { transform: 'rotate(1080deg) scale(1)', opacity: 1, filter: 'blur(0px)' }
    ], { duration: 2400, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });

    introSequence.onfinish = ()=>{
      overlay.classList.add('fade-in');
      setTimeout(() => {
        overlay.animate([{opacity:1},{opacity:0}],{duration:600,fill:'forwards'}).onfinish = () => {
          overlay.classList.add('intro-hidden');
          overlay.remove();
          sessionStorage.setItem('introPlayed','true');
        };
      }, 3000);
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
