// onboarding.js - Onboarding flow with smooth transitions

(function(){
  'use strict';

  const ONBOARDING_KEY = 'resetCompassOnboardingComplete';
  const TOTAL_SLIDES = 5;
  let currentSlide = 0;

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  function init() {
    const btnNext = $('#btnNext');
    const btnSkip = $('#btnSkip');
    const btnGetStarted = $('#btnGetStarted');
    const dotsIndicator = $('#dotsIndicator');

    if (!btnNext || !btnSkip || !dotsIndicator) return;

    setupDots();
    updateUI();

    btnNext.addEventListener('click', nextSlide);
    btnSkip.addEventListener('click', completeOnboarding);
    
    if (btnGetStarted) {
      btnGetStarted.addEventListener('click', completeOnboarding);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') completeOnboarding();
    });

    dotsIndicator.addEventListener('click', (e) => {
      const dot = e.target.closest('.dot');
      if (dot) {
        const index = parseInt(dot.dataset.index);
        goToSlide(index);
      }
    });
  }

  function setupDots() {
    const dotsIndicator = $('#dotsIndicator');
    if (!dotsIndicator) return;

    dotsIndicator.innerHTML = '';
    for (let i = 0; i < TOTAL_SLIDES; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.dataset.index = i;
      if (i === 0) dot.classList.add('active');
      dotsIndicator.appendChild(dot);
    }
  }

  function updateUI() {
    const slides = $all('.onboarding-slide');
    const dots = $all('.dot');
    const progressBar = $('#progressBar');
    const btnNext = $('#btnNext');

    slides.forEach((slide, index) => {
      slide.classList.remove('active', 'prev');
      if (index === currentSlide) {
        slide.classList.add('active');
      } else if (index < currentSlide) {
        slide.classList.add('prev');
      }
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide);
    });

    if (progressBar) {
      const progress = ((currentSlide + 1) / TOTAL_SLIDES) * 100;
      progressBar.style.width = `${progress}%`;
    }

    if (btnNext) {
      if (currentSlide === TOTAL_SLIDES - 1) {
        btnNext.style.display = 'none';
      } else {
        btnNext.style.display = 'block';
      }
    }
  }

  function nextSlide() {
    if (currentSlide < TOTAL_SLIDES - 1) {
      currentSlide++;
      updateUI();
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      currentSlide--;
      updateUI();
    }
  }

  function goToSlide(index) {
    if (index >= 0 && index < TOTAL_SLIDES) {
      currentSlide = index;
      updateUI();
    }
  }

  function completeOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    
    document.body.classList.add('page-transition-out');
    
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
