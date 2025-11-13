// shuffle-mode-ui.js - UI controller for Shuffle Mode
// Handles rendering, animations, keyboard and swipe gestures

(function() {
  'use strict';

  let dialog = null;
  let activityCard = null;
  let shuffleBtn = null;
  let allowRepeatToggle = null;
  let progressBar = null;
  let progressText = null;
  let completeBtn = null;
  let prevBtn = null;
  let nextBtn = null;
  let focusTrap = null;
  let touchStartX = 0;
  let touchEndX = 0;

  const SWIPE_THRESHOLD = 50;

  // Check for reduced motion preference
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Initialize Shuffle Mode UI
  function init() {
    dialog = document.getElementById('shuffleModeDialog');
    if (!dialog) {
      console.warn('Shuffle Mode dialog not found');
      return;
    }

    activityCard = document.getElementById('shuffleActivityCard');
    shuffleBtn = document.getElementById('shuffleNowBtn');
    allowRepeatToggle = document.getElementById('allowRepeatToggle');
    progressBar = document.getElementById('shuffleProgress');
    progressText = document.getElementById('shuffleProgressText');
    completeBtn = document.getElementById('completeShuffleActivityBtn');
    prevBtn = document.getElementById('shufflePrevBtn');
    nextBtn = document.getElementById('shuffleNextBtn');

    // Wire up event listeners
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', handleShuffle);
    }

    if (allowRepeatToggle) {
      allowRepeatToggle.addEventListener('change', handleAllowRepeatToggle);
    }

    if (completeBtn) {
      completeBtn.addEventListener('click', handleComplete);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', handlePrevious);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', handleNext);
    }

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboard);

    // Touch/swipe gestures
    if (activityCard) {
      activityCard.addEventListener('touchstart', handleTouchStart, { passive: true });
      activityCard.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Dialog close handlers
    const closeButtons = dialog.querySelectorAll('.dialog-close, .dialog-cancel');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', close);
    });

    // Escape key to close
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        close();
      }
    });

    // Setup focus trap
    setupFocusTrap();
  }

  // Setup focus trap for accessibility
  function setupFocusTrap() {
    if (!dialog || typeof window.focusTrap === 'undefined') {
      console.warn('Focus trap not available');
      return;
    }

    try {
      focusTrap = window.focusTrap.createFocusTrap(dialog, {
        escapeDeactivates: true,
        allowOutsideClick: true,
        initialFocus: shuffleBtn
      });
    } catch (e) {
      console.warn('Could not create focus trap:', e);
    }
  }

  // Open shuffle mode dialog
  function open() {
    if (!dialog) return;

    // Initialize shuffle session
    const initialized = window.ShuffleMode.initialize(false);
    if (!initialized) {
      console.error('Failed to initialize shuffle session');
      return;
    }

    // Show dialog
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    // Activate focus trap
    if (focusTrap) {
      try {
        focusTrap.activate();
      } catch (e) {
        console.warn('Could not activate focus trap:', e);
      }
    }

    // Render first activity
    renderCurrentActivity();
    updateProgress();
  }

  // Close shuffle mode dialog
  function close() {
    if (!dialog) return;

    // Deactivate focus trap
    if (focusTrap) {
      try {
        focusTrap.deactivate();
      } catch (e) {
        console.warn('Could not deactivate focus trap:', e);
      }
    }

    // Close dialog
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }

    // Reset session
    window.ShuffleMode.reset();
  }

  // Render current activity
  function renderCurrentActivity(direction = 'none') {
    const activity = window.ShuffleMode.getCurrent();
    if (!activity || !activityCard) return;

    const animationClass = prefersReducedMotion() ? '' : getAnimationClass(direction);

    const html = `
      <div class="shuffle-activity-content ${animationClass}">
        <div class="activity-mode-badge" style="background: ${activity.modeColor}">
          ${escapeHtml(activity.modeName)}
        </div>
        <div class="activity-icon-large">
          ${activity.icon ? `<img src="${activity.icon}" alt="" aria-hidden="true" />` : '✨'}
        </div>
        <h3 class="activity-title-large">${escapeHtml(activity.title)}</h3>
        <p class="activity-explain-large">${escapeHtml(activity.explain)}</p>
        ${activity.duration ? `<div class="activity-duration">⏱️ ${Math.ceil(activity.duration / 60)} min</div>` : ''}
      </div>
    `;

    activityCard.innerHTML = html;
  }

  // Get animation class based on direction
  function getAnimationClass(direction) {
    switch (direction) {
      case 'next':
        return 'shuffle-slide-in-right';
      case 'prev':
        return 'shuffle-slide-in-left';
      case 'shuffle':
        return 'shuffle-fade-in';
      default:
        return '';
    }
  }

  // Update progress bar and text
  function updateProgress() {
    const progress = window.ShuffleMode.getProgress();
    
    if (progressBar) {
      progressBar.style.width = `${progress.percentage}%`;
    }

    if (progressText) {
      progressText.textContent = `Activity ${progress.current} of ${progress.total}`;
    }

    // Update navigation button states
    updateNavigationButtons();
  }

  // Update navigation button states
  function updateNavigationButtons() {
    const session = window.ShuffleMode.getSession();
    const progress = window.ShuffleMode.getProgress();

    if (prevBtn) {
      prevBtn.disabled = session.currentIndex === 0;
    }

    if (nextBtn) {
      const isLast = progress.current >= progress.total;
      nextBtn.disabled = isLast && !session.allowRepeat;
      if (isLast && !session.allowRepeat) {
        nextBtn.textContent = 'Deck Exhausted';
      } else {
        nextBtn.innerHTML = 'Next <span aria-hidden="true">→</span>';
      }
    }
  }

  // Handle shuffle button click
  function handleShuffle() {
    window.ShuffleMode.reshuffle();
    renderCurrentActivity('shuffle');
    updateProgress();
  }

  // Handle allow repeat toggle
  function handleAllowRepeatToggle(e) {
    window.ShuffleMode.toggleAllowRepeat();
    updateNavigationButtons();
  }

  // Handle complete button click
  function handleComplete() {
    const activity = window.ShuffleMode.getCurrent();
    if (!activity) return;

    // Record activity using existing system
    if (typeof window.recordActivities === 'function') {
      window.recordActivities([{
        modeId: activity.modeId,
        modeName: activity.modeName,
        modeColor: activity.modeColor,
        action: activity.title,
        note: ''
      }]);
    }

    // Move to next activity or close if deck exhausted
    const next = window.ShuffleMode.next();
    if (next && !next.exhausted) {
      renderCurrentActivity('next');
      updateProgress();
    } else if (next && next.exhausted) {
      // Show completion message
      showCompletionMessage();
    }
  }

  // Show completion message when deck exhausted
  function showCompletionMessage() {
    if (!activityCard) return;

    activityCard.innerHTML = `
      <div class="shuffle-completion shuffle-fade-in">
        <div class="completion-icon">🎉</div>
        <h3>Deck Complete!</h3>
        <p>You've gone through all activities. Enable "Allow Repeat" or close and come back later for a fresh shuffle.</p>
        <div class="completion-actions">
          <button class="btn-primary" id="enableRepeatBtn">
            Enable Repeat & Continue
          </button>
          <button class="btn-secondary" id="closeCompletionBtn">Close</button>
        </div>
      </div>
    `;

    // Attach event listeners after rendering
    const enableRepeatBtn = document.getElementById('enableRepeatBtn');
    if (enableRepeatBtn) {
      enableRepeatBtn.addEventListener('click', function() {
        const toggle = document.getElementById('allowRepeatToggle');
        if (toggle) {
          toggle.checked = true;
          toggle.dispatchEvent(new Event('change'));
        }
        window.ShuffleMode.reshuffle();
        renderCurrentActivity('shuffle');
        updateProgress();
      });
    }
    const closeCompletionBtn = document.getElementById('closeCompletionBtn');
    if (closeCompletionBtn) {
      closeCompletionBtn.addEventListener('click', function() {
        close();
      });
    }
  // Handle next button
  function handleNext() {
    const next = window.ShuffleMode.next();
    if (next && !next.exhausted) {
      renderCurrentActivity('next');
      updateProgress();
    } else if (next && next.exhausted) {
      showCompletionMessage();
    }
  }

  // Handle previous button
  function handlePrevious() {
    window.ShuffleMode.previous();
    renderCurrentActivity('prev');
    updateProgress();
  }

  // Handle keyboard navigation
  function handleKeyboard(e) {
    if (!dialog || !dialog.hasAttribute('open')) return;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (nextBtn && !nextBtn.disabled) {
          handleNext();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (prevBtn && !prevBtn.disabled) {
          handlePrevious();
        }
        break;
    }
  }

  // Handle touch start
  function handleTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
  }

  // Handle touch end (swipe detection)
  function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }

  // Handle swipe gesture
  function handleSwipe() {
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) < SWIPE_THRESHOLD) return;

    if (diff > 0) {
      // Swipe left - next
      if (nextBtn && !nextBtn.disabled) {
        handleNext();
      }
    } else {
      // Swipe right - previous
      if (prevBtn && !prevBtn.disabled) {
        handlePrevious();
      }
    }
  }

  // Utility: Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Export public API
  window.ShuffleModeUI = {
    init: init,
    open: open,
    close: close,
    renderCurrentActivity: renderCurrentActivity,
    updateProgress: updateProgress
  };

  // Auto-initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('ShuffleModeUI module loaded');
})();
