// js/shuffle-mode.js
// Shuffle Mode - presents activities in randomized order with non-repeating shuffle

(function(){
  'use strict';

  /**
   * Shuffle Mode module
   * Implements Fisher-Yates shuffle for non-repeating activities
   */
  window.ShuffleMode = {
    activities: [],
    shuffledActivities: [],
    currentIndex: 0,
    allowRepeat: false,
    currentMode: null,
    logActivity: null,
    onClose: null,
    focusTrap: null,
    
    /**
     * Initialize Shuffle Mode
     * @param {Object} options
     * @param {string} options.mode - Mode ID (surviving, drifting, grounded, growing)
     * @param {Function} options.logActivity - Function to log activity completion
     * @param {Function} options.onClose - Function called when view closes
     */
    async init(options) {
      this.currentMode = options.mode;
      this.logActivity = options.logActivity;
      this.onClose = options.onClose;
      
      try {
        // Load activities for this mode
        const response = await fetch('data/activities.json');
        const data = await response.json();
        this.activities = data.modes[options.mode] || [];
        
        if (this.activities.length === 0) {
          console.error('No activities found for mode:', options.mode);
          return;
        }
        
        // Initial shuffle
        this.shuffleActivities();
        
        // Render UI
        this.render();
        
      } catch (error) {
        console.error('Failed to load activities for shuffle mode:', error);
      }
    },
    
    /**
     * Fisher-Yates shuffle algorithm
     */
    shuffleActivities() {
      this.shuffledActivities = [...this.activities];
      for (let i = this.shuffledActivities.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.shuffledActivities[i], this.shuffledActivities[j]] = 
          [this.shuffledActivities[j], this.shuffledActivities[i]];
      }
      this.currentIndex = 0;
    },
    
    /**
     * Move to next activity
     */
    nextActivity() {
      this.currentIndex++;
      
      // Check if deck is exhausted
      if (this.currentIndex >= this.shuffledActivities.length) {
        if (this.allowRepeat) {
          // Re-shuffle and start over
          this.shuffleActivities();
          if (window.showToast) {
            window.showToast('🔄 Deck reshuffled!');
          }
        } else {
          // Show completion message
          if (window.showToast) {
            window.showToast('✅ All activities shown!');
          }
          this.currentIndex = this.shuffledActivities.length - 1;
        }
      }
      
      this.updateActivityDisplay();
    },
    
    /**
     * Move to previous activity
     */
    previousActivity() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.updateActivityDisplay();
      }
    },
    
    /**
     * Manually trigger shuffle
     */
    manualShuffle() {
      this.shuffleActivities();
      this.updateActivityDisplay();
      if (window.showToast) {
        window.showToast('🔀 Shuffled!');
      }
    },
    
    /**
     * Render the Shuffle Mode UI
     */
    render() {
      const dialogQuickWins = document.getElementById('dialogQuickWins');
      if (!dialogQuickWins) return;
      
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animationClass = reducedMotion ? '' : 'shuffle-mode-enter';
      
      dialogQuickWins.innerHTML = `
        <div class="shuffle-mode-container ${animationClass}">
          <div class="shuffle-mode-header">
            <h3 style="
              font-size: 20px;
              font-weight: 700;
              color: var(--text-primary);
              margin: 0 0 12px 0;
            ">🔀 Shuffle Mode</h3>
            <p style="
              font-size: 14px;
              color: var(--text-secondary);
              line-height: 1.5;
              margin: 0 0 16px 0;
            ">
              We'll present activities in a randomized order. Tap <strong>Shuffle Now</strong> or swipe to go to the next activity. 
              Activities won't repeat until the deck is exhausted.
            </p>
          </div>
          
          <div class="shuffle-mode-controls" style="
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 12px;
            background: var(--bg-primary);
            border-radius: 8px;
          ">
            <button class="btn-secondary shuffle-now-btn" style="
              flex: 1;
              min-width: 120px;
            ">
              <span class="btn-icon">🔀</span>
              <span class="btn-text">Shuffle Now</span>
            </button>
            
            <label class="shuffle-repeat-toggle" style="
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
              color: var(--text-secondary);
              cursor: pointer;
            ">
              <input type="checkbox" id="allowRepeatCheckbox" style="
                width: 18px;
                height: 18px;
                cursor: pointer;
              ">
              <span>Allow repeat</span>
            </label>
          </div>
          
          <div class="shuffle-activity-display" id="shuffleActivityDisplay">
            <!-- Activity will be rendered here -->
          </div>
        </div>
      `;
      
      this.updateActivityDisplay();
      this.wireEvents();
      this.setupGestureSupport();
      this.setupKeyboardSupport();
    },
    
    /**
     * Update the current activity display
     */
    updateActivityDisplay() {
      const displayEl = document.getElementById('shuffleActivityDisplay');
      if (!displayEl) return;
      
      const activity = this.shuffledActivities[this.currentIndex];
      const progress = `${this.currentIndex + 1} of ${this.shuffledActivities.length}`;
      const isFirst = this.currentIndex === 0;
      const isLast = this.currentIndex === this.shuffledActivities.length - 1;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animationClass = reducedMotion ? '' : 'shuffle-card-transition';
      
      displayEl.innerHTML = `
        <div class="shuffle-activity-card ${animationClass}" style="
          background: linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-primary) 100%);
          border: 2px solid var(--border-color);
          border-radius: 16px;
          padding: 32px 24px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          position: relative;
          overflow: hidden;
          transform: translateZ(0);
          will-change: transform, opacity;
        ">
          <div class="shuffle-progress" style="
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(128, 128, 128, 0.2);
            color: var(--text-secondary);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          ">${progress}</div>
          
          ${activity.icon ? `<div class="activity-icon" style="font-size: 64px; margin-bottom: 24px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));">${activity.icon}</div>` : '<div style="height: 24px;"></div>'}
          
          <div class="activity-text" style="
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 24px;
            line-height: 1.5;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
          ">${escapeHtml(activity.text)}</div>
          
          <div class="shuffle-navigation" style="
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 24px;
          ">
            <button class="btn-secondary shuffle-prev-btn" ${isFirst ? 'disabled' : ''} style="
              min-width: 100px;
              opacity: ${isFirst ? '0.5' : '1'};
            ">
              <span class="btn-icon">←</span>
              <span class="btn-text">Previous</span>
            </button>
            
            <button class="btn-primary shuffle-done-btn" style="
              min-width: 140px;
            ">
              <span class="btn-icon">✓</span>
              <span class="btn-text">Complete</span>
            </button>
            
            <button class="btn-secondary shuffle-next-btn" ${isLast && !this.allowRepeat ? 'disabled' : ''} style="
              min-width: 100px;
              opacity: ${isLast && !this.allowRepeat ? '0.5' : '1'};
            ">
              <span class="btn-text">Next</span>
              <span class="btn-icon">→</span>
            </button>
          </div>
          
          <textarea class="activity-note" id="shuffleActivityNote" placeholder="Add notes (optional)" style="
            width: 100%;
            margin-top: 24px;
            padding: 12px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
            min-height: 80px;
          "></textarea>
          
          <div class="shuffle-hint" style="
            margin-top: 16px;
            padding: 12px;
            background: rgba(128, 128, 128, 0.1);
            border-radius: 8px;
            font-size: 13px;
            color: var(--text-secondary);
            text-align: center;
          ">
            💡 Tip: Use arrow keys or swipe to navigate
          </div>
        </div>
      `;
      
      // Re-wire navigation events after update
      this.wireNavigationEvents();
    },
    
    /**
     * Wire up event listeners
     */
    wireEvents() {
      const shuffleBtn = document.querySelector('.shuffle-now-btn');
      const repeatCheckbox = document.getElementById('allowRepeatCheckbox');
      
      if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => this.manualShuffle());
      }
      
      if (repeatCheckbox) {
        repeatCheckbox.addEventListener('change', (e) => {
          this.allowRepeat = e.target.checked;
          // Re-render to update button states
          this.updateActivityDisplay();
        });
      }
      
      this.wireNavigationEvents();
    },
    
    /**
     * Wire navigation button events
     */
    wireNavigationEvents() {
      const prevBtn = document.querySelector('.shuffle-prev-btn');
      const nextBtn = document.querySelector('.shuffle-next-btn');
      const doneBtn = document.querySelector('.shuffle-done-btn');
      
      if (prevBtn) {
        prevBtn.addEventListener('click', () => this.previousActivity());
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.nextActivity());
      }
      
      if (doneBtn) {
        doneBtn.addEventListener('click', () => this.handleComplete());
      }
    },
    
    /**
     * Setup gesture support (swipe)
     */
    setupGestureSupport() {
      const displayEl = document.getElementById('shuffleActivityDisplay');
      if (!displayEl) return;
      
      let touchStartX = 0;
      let touchEndX = 0;
      
      displayEl.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      displayEl.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        this.handleGesture();
      }, { passive: true });
      
      const handleGesture = () => {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
          // Swipe left - next
          this.nextActivity();
        }
        if (touchEndX > touchStartX + swipeThreshold) {
          // Swipe right - previous
          this.previousActivity();
        }
      };
      
      this.handleGesture = handleGesture;
    },
    
    /**
     * Setup keyboard support
     */
    setupKeyboardSupport() {
      const keyHandler = (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.previousActivity();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.nextActivity();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          if (this.onClose) {
            this.onClose();
          }
        }
      };
      
      document.addEventListener('keydown', keyHandler);
      
      // Store handler for cleanup
      this.keyHandler = keyHandler;
    },
    
    /**
     * Handle activity completion
     */
    handleComplete() {
      const activity = this.shuffledActivities[this.currentIndex];
      const noteTextarea = document.getElementById('shuffleActivityNote');
      const note = noteTextarea ? noteTextarea.value.trim() : '';
      
      if (this.logActivity) {
        const payload = {
          type: 'mode',
          mode: this.currentMode,
          activity: activity,
          timestamp: new Date().toISOString(),
          note: note
        };
        
        this.logActivity(payload);
      }
      
      // Cleanup
      this.cleanup();
      
      if (this.onClose) {
        this.onClose();
      }
    },
    
    /**
     * Cleanup event listeners
     */
    cleanup() {
      if (this.keyHandler) {
        document.removeEventListener('keydown', this.keyHandler);
      }
    }
  };
  
  // Helper function to escape HTML
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  // Add Shuffle Mode animation styles
  if (!document.querySelector('#shuffle-mode-styles')) {
    const style = document.createElement('style');
    style.id = 'shuffle-mode-styles';
    style.textContent = `
      .shuffle-mode-container {
        animation: fadeIn 0.3s ease-out;
      }
      
      .shuffle-card-transition {
        animation: cardFlip 0.4s ease-out;
      }
      
      @keyframes fadeIn {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes cardFlip {
        0% {
          transform: translateZ(0) rotateY(10deg);
          opacity: 0.8;
        }
        100% {
          transform: translateZ(0) rotateY(0deg);
          opacity: 1;
        }
      }
      
      /* Respect prefers-reduced-motion */
      @media (prefers-reduced-motion: reduce) {
        .shuffle-mode-container {
          animation: none;
        }
        
        .shuffle-card-transition {
          animation: none;
        }
        
        .shuffle-mode-enter {
          animation: none;
        }
      }
      
      /* Hardware-accelerated transforms */
      .shuffle-activity-card {
        transform: translateZ(0);
        will-change: transform, opacity;
        backface-visibility: hidden;
      }
      
      /* Smooth transitions */
      .shuffle-activity-card,
      .shuffle-navigation button {
        transition: transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease;
      }
      
      .shuffle-navigation button:not(:disabled):hover {
        transform: translateY(-2px) translateZ(0);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      
      .shuffle-navigation button:not(:disabled):active {
        transform: translateY(0) translateZ(0);
      }
    `;
    document.head.appendChild(style);
  }
  
})();
