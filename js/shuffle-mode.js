// js/shuffle-mode.js
// Shuffle Mode - presents all activities in randomized order without repeating until deck exhausted

(function(){
  'use strict';

  // Module to show all activities across all modes in shuffle mode
  window.ShuffleMode = {
    allActivities: [],
    shuffledDeck: [],
    currentIndex: 0,
    allowRepeat: false,
    currentActivity: null,
    currentMode: null,
    logActivity: null,
    onClose: null,
    
    /**
     * Initialize and show Shuffle Mode view
     * @param {Object} options
     * @param {Function} options.logActivity - Function to log activity completion
     * @param {Function} options.onClose - Optional function called when view closes
     */
    async init(options) {
      this.logActivity = options.logActivity;
      this.onClose = options.onClose;
      
      try {
        // Load all activities from all modes
        const response = await fetch('data/modes.json');
        const data = await response.json();
        
        // Flatten all activities from all modes
        this.allActivities = [];
        data.modes.forEach(mode => {
          if (mode.activities) {
            mode.activities.forEach(activity => {
              this.allActivities.push({
                ...activity,
                mode: mode.id,
                modeTitle: mode.title,
                modeColor: mode.color
              });
            });
          }
        });
        
        if (this.allActivities.length === 0) {
          console.error('No activities found for shuffle mode');
          return;
        }
        
        // Initialize shuffle deck
        this.shuffleDeck();
        this.currentIndex = 0;
        
        // Show first activity
        this.showCurrentActivity();
        
      } catch (error) {
        console.error('Failed to load activities for shuffle mode:', error);
      }
    },
    
    /**
     * Fisher-Yates shuffle algorithm
     * Shuffles the deck without repeating until exhausted
     */
    shuffleDeck() {
      const deck = [...this.allActivities];
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      this.shuffledDeck = deck;
    },
    
    /**
     * Move to next activity in shuffle
     */
    nextActivity() {
      this.currentIndex++;
      
      // Check if deck exhausted
      if (this.currentIndex >= this.shuffledDeck.length) {
        if (this.allowRepeat) {
          // Re-shuffle and start over
          this.shuffleDeck();
          this.currentIndex = 0;
        } else {
          // Wrap around but show message
          this.currentIndex = 0;
          this.showDeckExhaustedMessage();
          return;
        }
      }
      
      this.showCurrentActivity();
    },
    
    /**
     * Move to previous activity in shuffle
     */
    prevActivity() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.showCurrentActivity();
      }
    },
    
    /**
     * Shuffle the deck again
     */
    reshuffleNow() {
      this.shuffleDeck();
      this.currentIndex = 0;
      this.showCurrentActivity();
    },
    
    /**
     * Toggle allow repeat setting
     */
    toggleAllowRepeat() {
      this.allowRepeat = !this.allowRepeat;
      this.updateAllowRepeatUI();
    },
    
    /**
     * Update the allow repeat toggle UI
     */
    updateAllowRepeatUI() {
      const toggle = document.querySelector('.shuffle-allow-repeat-toggle');
      if (toggle) {
        const checkbox = toggle.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = this.allowRepeat;
        }
      }
    },
    
    /**
     * Show message when deck is exhausted
     */
    showDeckExhaustedMessage() {
      const container = document.getElementById('dialogQuickWins');
      if (!container) return;
      
      // Show message with option to reshuffle or enable repeat
      container.innerHTML = `
        <li class="deck-exhausted-view" style="animation: fadeIn 0.3s ease-out; list-style: none;">
          <div class="exhausted-card" style="
            background: var(--bg-elevated);
            border: 2px solid var(--brand-glow);
            border-radius: 16px;
            padding: 32px 24px;
            text-align: center;
            box-shadow: 0 4px 16px rgba(0,230,166,0.2);
          ">
            <div class="exhausted-icon" style="font-size: 64px; margin-bottom: 16px;">🎉</div>
            <div class="exhausted-title" style="
              font-size: 24px;
              font-weight: 700;
              color: var(--brand-glow);
              margin-bottom: 12px;
            ">Deck Exhausted!</div>
            <div class="exhausted-message" style="
              font-size: 16px;
              color: var(--text-secondary);
              margin-bottom: 24px;
              line-height: 1.5;
            ">
              You've seen all ${this.shuffledDeck.length} activities. Great work!<br>
              Shuffle again to continue, or enable "Allow Repeat" to automatically reshuffle.
            </div>
            <button class="btn-primary shuffle-reshuffle-btn" style="
              margin-bottom: 12px;
            ">
              <span class="btn-icon">🔀</span>
              <span class="btn-text">Shuffle Again</span>
            </button>
          </div>
        </li>
      `;
      
      // Wire up reshuffle button
      const reshuffleBtn = container.querySelector('.shuffle-reshuffle-btn');
      if (reshuffleBtn) {
        reshuffleBtn.addEventListener('click', () => this.reshuffleNow());
      }
    },
    
    /**
     * Show the current activity
     */
    showCurrentActivity() {
      if (!this.shuffledDeck || this.shuffledDeck.length === 0) return;
      
      this.currentActivity = this.shuffledDeck[this.currentIndex];
      this.currentMode = this.currentActivity.mode;
      this.render();
    },
    
    /**
     * Render the shuffle mode view in the existing modal
     */
    render() {
      const container = document.getElementById('dialogQuickWins');
      if (!container) return;
      
      const activity = this.currentActivity;
      const progressText = `${this.currentIndex + 1} of ${this.shuffledDeck.length}`;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animationClass = reduceMotion ? '' : 'shuffle-card-transition';
      
      // Render activity card with shuffle controls
      container.innerHTML = `
        <li class="${animationClass}" style="list-style: none;">
          <div class="shuffle-mode-header" style="
            text-align: center;
            margin-bottom: 24px;
            padding: 16px;
            background: linear-gradient(135deg, rgba(0,230,166,0.1), rgba(46,127,232,0.1));
            border-radius: 12px;
            border: 1px solid rgba(0,230,166,0.2);
          ">
            <div class="shuffle-icon" style="font-size: 32px; margin-bottom: 8px;">🔀</div>
            <div class="shuffle-title" style="
              font-size: 18px;
              font-weight: 700;
              color: var(--brand-glow);
              margin-bottom: 8px;
            ">Shuffle Mode</div>
            <div class="shuffle-instructions" style="
              font-size: 14px;
              color: var(--text-secondary);
              line-height: 1.5;
              max-width: 500px;
              margin: 0 auto 16px;
            ">
              We'll present activities in a randomized order — tap Shuffle Now or swipe to go to the next activity. Activities won't repeat until the deck is exhausted.
            </div>
            <div class="shuffle-progress" style="
              font-size: 14px;
              color: var(--text-primary);
              font-weight: 600;
            ">Activity ${progressText}</div>
          </div>
          
          <div class="activity-card" style="
            background: var(--bg-elevated);
            border: 2px solid ${activity.modeColor};
            border-radius: 16px;
            padding: 32px 24px;
            text-align: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            position: relative;
          ">
            <div class="activity-mode-badge" style="
              position: absolute;
              top: 12px;
              right: 12px;
              background: ${activity.modeColor};
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
            ">${escapeHtml(activity.modeTitle)}</div>
            
            ${activity.icon ? `<div class="activity-icon" style="font-size: 56px; margin-bottom: 20px;">
              <img src="${activity.icon}" alt="" style="width: 56px; height: 56px;" onerror="this.style.display='none'" />
            </div>` : ''}
            
            <div class="activity-title" style="
              font-size: 24px;
              font-weight: 700;
              color: var(--text-primary);
              margin-bottom: 12px;
              line-height: 1.3;
            ">${escapeHtml(activity.title)}</div>
            
            <div class="activity-explain" style="
              font-size: 16px;
              color: var(--text-secondary);
              margin-bottom: 24px;
              line-height: 1.5;
            ">${escapeHtml(activity.explain)}</div>
            
            <div class="shuffle-navigation" style="
              display: flex;
              gap: 12px;
              justify-content: center;
              flex-wrap: wrap;
              margin-bottom: 16px;
            ">
              <button class="btn-secondary shuffle-prev-btn" ${this.currentIndex === 0 ? 'disabled' : ''} style="
                flex: 0 1 auto;
                min-width: 100px;
              ">
                <span class="btn-icon">←</span>
                <span class="btn-text">Previous</span>
              </button>
              
              <button class="btn-primary shuffle-next-btn" style="
                flex: 0 1 auto;
                min-width: 140px;
              ">
                <span class="btn-icon">→</span>
                <span class="btn-text">Next Activity</span>
              </button>
              
              <button class="btn-secondary shuffle-reshuffle-small-btn" style="
                flex: 0 1 auto;
                min-width: 100px;
              ">
                <span class="btn-icon">🔀</span>
                <span class="btn-text">Shuffle</span>
              </button>
            </div>
            
            <div class="shuffle-actions" style="
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-top: 20px;
            ">
              <button class="btn-primary shuffle-done-btn" style="
                flex: 1;
                max-width: 200px;
              ">
                <span class="btn-icon">✓</span>
                <span class="btn-text">Done</span>
              </button>
            </div>
          </div>
          
          <div class="shuffle-options" style="
            margin-top: 20px;
            padding: 16px;
            background: var(--bg-secondary);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <label class="shuffle-allow-repeat-toggle" style="
              display: flex;
              align-items: center;
              gap: 8px;
              cursor: pointer;
              user-select: none;
            ">
              <input type="checkbox" ${this.allowRepeat ? 'checked' : ''} style="
                width: 20px;
                height: 20px;
                cursor: pointer;
              " />
              <span style="
                font-size: 14px;
                color: var(--text-primary);
              ">Allow repeat (auto-reshuffle when deck exhausted)</span>
            </label>
          </div>
          
          <textarea class="activity-note" placeholder="Add notes (optional)" style="
            width: 100%;
            margin-top: 20px;
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
            min-height: 80px;
          "></textarea>
        </li>
      `;
      
      // Wire up event listeners
      this.wireEvents();
      
      // Add swipe support if not reduced motion
      if (!reduceMotion) {
        this.addSwipeSupport(container);
      }
      
      // Add keyboard support
      this.addKeyboardSupport();
    },
    
    /**
     * Wire up event listeners for buttons
     */
    wireEvents() {
      const doneBtn = document.querySelector('.shuffle-done-btn');
      const nextBtn = document.querySelector('.shuffle-next-btn');
      const prevBtn = document.querySelector('.shuffle-prev-btn');
      const reshuffleBtn = document.querySelector('.shuffle-reshuffle-small-btn');
      const allowRepeatToggle = document.querySelector('.shuffle-allow-repeat-toggle input');
      
      if (doneBtn) {
        doneBtn.addEventListener('click', () => this.handleDone());
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.nextActivity());
      }
      
      if (prevBtn) {
        prevBtn.addEventListener('click', () => this.prevActivity());
      }
      
      if (reshuffleBtn) {
        reshuffleBtn.addEventListener('click', () => this.reshuffleNow());
      }
      
      if (allowRepeatToggle) {
        allowRepeatToggle.addEventListener('change', () => this.toggleAllowRepeat());
      }
    },
    
    /**
     * Add swipe gesture support
     */
    addSwipeSupport(container) {
      let touchStartX = 0;
      let touchEndX = 0;
      
      const handleSwipe = () => {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
          if (diff > 0) {
            // Swiped left - next activity
            this.nextActivity();
          } else {
            // Swiped right - previous activity
            this.prevActivity();
          }
        }
      };
      
      container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
    },
    
    /**
     * Add keyboard navigation support
     */
    addKeyboardSupport() {
      const handleKeydown = (e) => {
        // Only handle if shuffle mode is active
        const container = document.getElementById('dialogQuickWins');
        if (!container || !container.querySelector('.shuffle-mode-header')) return;
        
        switch(e.key) {
          case 'ArrowRight':
          case 'n':
          case 'N':
            e.preventDefault();
            this.nextActivity();
            break;
          case 'ArrowLeft':
          case 'p':
          case 'P':
            e.preventDefault();
            this.prevActivity();
            break;
          case 's':
          case 'S':
            e.preventDefault();
            this.reshuffleNow();
            break;
        }
      };
      
      // Remove old listener if exists
      if (this._keydownHandler) {
        document.removeEventListener('keydown', this._keydownHandler);
      }
      
      this._keydownHandler = handleKeydown;
      document.addEventListener('keydown', handleKeydown);
    },
    
    /**
     * Handle Done button click
     */
    handleDone() {
      const noteTextarea = document.querySelector('.activity-note');
      const note = noteTextarea ? noteTextarea.value.trim() : '';
      
      // Call logActivity with standardized payload
      if (this.logActivity) {
        const payload = {
          type: 'shuffle',
          mode: this.currentActivity.mode,
          activity: this.currentActivity,
          timestamp: new Date().toISOString(),
          note: note
        };
        
        this.logActivity(payload);
      }
      
      // Clean up keyboard listener
      if (this._keydownHandler) {
        document.removeEventListener('keydown', this._keydownHandler);
        this._keydownHandler = null;
      }
      
      // Call onClose if provided
      if (this.onClose) {
        this.onClose();
      }
    },
    
    /**
     * Clean up when mode is closed
     */
    cleanup() {
      if (this._keydownHandler) {
        document.removeEventListener('keydown', this._keydownHandler);
        this._keydownHandler = null;
      }
    }
  };
  
  // Helper function to escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  // Add shuffle mode animations CSS if not already present
  if (!document.querySelector('#shuffle-mode-styles')) {
    const style = document.createElement('style');
    style.id = 'shuffle-mode-styles';
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      @keyframes shuffleCardIn {
        from {
          opacity: 0;
          transform: translateX(30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }
      
      @keyframes shuffleCardOut {
        from {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateX(-30px) scale(0.95);
        }
      }
      
      .shuffle-card-transition {
        animation: shuffleCardIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      @media (prefers-reduced-motion: reduce) {
        .shuffle-card-transition {
          animation: none;
        }
      }
      
      .shuffle-mode-header {
        transition: transform 0.2s ease;
      }
      
      .activity-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      .activity-card:hover {
        transform: translateY(-2px);
      }
      
      @media (prefers-reduced-motion: reduce) {
        .shuffle-mode-header,
        .activity-card {
          transition: none;
        }
        .activity-card:hover {
          transform: none;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
})();
