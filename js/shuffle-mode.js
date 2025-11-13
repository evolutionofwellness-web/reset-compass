// js/shuffle-mode.js
// Shuffle Mode: Presents all activities in a randomized order
// Uses Fisher-Yates shuffle to avoid repeats until the whole deck is exhausted

(function(){
  'use strict';

  // Module to show activities in shuffle mode
  window.ShuffleMode = {
    shuffledActivities: [],
    currentIndex: 0,
    currentMode: null,
    logActivity: null,
    onClose: null,
    sessionActive: false,
    
    /**
     * Initialize and show shuffle mode
     * @param {Object} options
     * @param {string} options.mode - Mode ID (surviving, drifting, grounded, growing)
     * @param {Array} options.activities - Array of activities to shuffle
     * @param {Function} options.logActivity - Function to log activity completion
     * @param {Function} options.onClose - Optional function called when view closes
     */
    async init(options) {
      this.currentMode = options.mode;
      this.logActivity = options.logActivity;
      this.onClose = options.onClose;
      
      // If we already have a session, continue it
      if (!this.sessionActive || this.currentMode !== options.mode) {
        // Start new shuffle session
        this.shuffledActivities = this.shuffle([...options.activities]);
        this.currentIndex = 0;
        this.sessionActive = true;
      }
      
      if (this.shuffledActivities.length === 0) {
        console.error('No activities to shuffle');
        return;
      }
      
      // Show the current activity
      this.showCurrentActivity();
    },
    
    /**
     * Fisher-Yates shuffle algorithm - produces truly random permutation
     * Ensures no repeats until the entire deck is exhausted
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffle(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    },
    
    /**
     * Show the current activity with animation
     */
    showCurrentActivity() {
      if (!this.shuffledActivities || this.shuffledActivities.length === 0) return;
      
      const activity = this.shuffledActivities[this.currentIndex];
      const progressText = `${this.currentIndex + 1} of ${this.shuffledActivities.length}`;
      
      this.render(activity, progressText);
    },
    
    /**
     * Move to next activity in shuffle
     */
    nextActivity() {
      this.currentIndex++;
      
      // If we've gone through all activities, reshuffle
      if (this.currentIndex >= this.shuffledActivities.length) {
        this.shuffledActivities = this.shuffle(this.shuffledActivities);
        this.currentIndex = 0;
      }
      
      this.showCurrentActivity();
    },
    
    /**
     * Shuffle and show a new random activity immediately
     */
    shuffleNow() {
      // Reshuffle the deck
      this.shuffledActivities = this.shuffle(this.shuffledActivities);
      this.currentIndex = 0;
      this.showCurrentActivity();
    },
    
    /**
     * Render the shuffle mode view
     */
    render(activity, progressText) {
      const dialogQuickWins = document.getElementById('dialogQuickWins');
      if (!dialogQuickWins) return;
      
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animationClass = reducedMotion ? 'fade-in' : 'shuffle-slide-in';
      
      // Render shuffle mode UI
      dialogQuickWins.innerHTML = `
        <li class="shuffle-mode-view ${animationClass}" style="list-style: none;">
          <div class="shuffle-header" style="
            text-align: center;
            padding: 20px 16px;
            background: linear-gradient(135deg, rgba(0, 230, 166, 0.1), rgba(46, 127, 232, 0.1));
            border-radius: 12px;
            margin-bottom: 24px;
            border: 1px solid rgba(0, 230, 166, 0.2);
          ">
            <div class="shuffle-icon" style="font-size: 42px; margin-bottom: 12px;">🔀</div>
            <h3 style="
              font-size: 20px;
              font-weight: 700;
              color: var(--text-primary);
              margin: 0 0 8px 0;
            ">Shuffle Mode</h3>
            <p style="
              font-size: 14px;
              color: var(--text-secondary);
              margin: 0;
              line-height: 1.5;
            ">
              Activities in randomized order — tap <strong>Shuffle Now</strong> to reshuffle, 
              or swipe through with <strong>Next Activity</strong>. No repeats until the whole deck is done!
            </p>
          </div>
          
          <div class="activity-card shuffle-card" style="
            background: var(--bg-elevated);
            border: 2px solid var(--border-color);
            border-radius: 16px;
            padding: 32px 24px;
            text-align: center;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            position: relative;
            overflow: hidden;
            transform: translateZ(0);
            will-change: transform;
          ">
            ${activity.icon ? `<div class="activity-icon" style="font-size: 56px; margin-bottom: 20px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));">${activity.icon}</div>` : ''}
            
            <div class="activity-text" style="
              font-size: 22px;
              font-weight: 700;
              color: var(--text-primary);
              margin-bottom: 16px;
              line-height: 1.5;
              min-height: 60px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">${escapeHtml(activity.text)}</div>
            
            <div class="shuffle-progress" style="
              font-size: 13px;
              color: var(--text-secondary);
              margin-bottom: 24px;
              opacity: 0.7;
              font-weight: 500;
            ">${progressText}</div>
            
            <div class="shuffle-actions" style="
              display: flex;
              gap: 12px;
              justify-content: center;
              flex-wrap: wrap;
              margin-bottom: 20px;
            ">
              <button class="btn-primary shuffle-done" style="
                flex: 1;
                min-width: 130px;
                max-width: 200px;
                transform: translateZ(0);
                transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;
              ">
                <span class="btn-icon">✓</span>
                <span class="btn-text">Done</span>
              </button>
              <button class="btn-secondary shuffle-next" style="
                flex: 1;
                min-width: 130px;
                max-width: 200px;
                transform: translateZ(0);
                transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              ">
                <span class="btn-icon">→</span>
                <span class="btn-text">Next Activity</span>
              </button>
            </div>
            
            <button class="btn-shuffle shuffle-now" style="
              width: 100%;
              background: linear-gradient(135deg, rgba(0, 230, 166, 0.15), rgba(46, 127, 232, 0.15));
              border: 2px solid rgba(0, 230, 166, 0.3);
              color: var(--text-primary);
              font-weight: 600;
              padding: 12px 20px;
              border-radius: 10px;
              cursor: pointer;
              font-size: 15px;
              transform: translateZ(0);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            ">
              <span style="font-size: 18px; margin-right: 8px;">🔀</span>
              <span>Shuffle Now</span>
            </button>
          </div>
          
          <textarea class="activity-note" placeholder="Add notes (optional)" style="
            width: 100%;
            margin-top: 20px;
            padding: 14px;
            border: 1px solid var(--border-color);
            border-radius: 10px;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
            min-height: 90px;
            transform: translateZ(0);
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          "></textarea>
        </li>
      `;
      
      // Wire up event listeners
      this.wireEvents();
    },
    
    /**
     * Wire up event listeners for buttons
     */
    wireEvents() {
      const doneBtn = document.querySelector('.shuffle-done');
      const nextBtn = document.querySelector('.shuffle-next');
      const shuffleBtn = document.querySelector('.shuffle-now');
      const noteTextarea = document.querySelector('.activity-note');
      
      if (doneBtn) {
        doneBtn.addEventListener('click', () => this.handleDone());
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.nextActivity());
      }
      
      if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => this.shuffleNow());
      }
      
      // Add focus styles
      if (noteTextarea) {
        noteTextarea.addEventListener('focus', (e) => {
          e.target.style.borderColor = 'var(--brand-glow)';
          e.target.style.boxShadow = '0 0 0 3px rgba(0, 230, 166, 0.1)';
        });
        noteTextarea.addEventListener('blur', (e) => {
          e.target.style.borderColor = 'var(--border-color)';
          e.target.style.boxShadow = 'none';
        });
      }
    },
    
    /**
     * Handle Done button click
     */
    handleDone() {
      const noteTextarea = document.querySelector('.activity-note');
      const note = noteTextarea ? noteTextarea.value.trim() : '';
      
      const activity = this.shuffledActivities[this.currentIndex];
      
      // Call logActivity with standardized payload
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
      
      // End shuffle session
      this.sessionActive = false;
      
      // Call onClose if provided
      if (this.onClose) {
        this.onClose();
      }
    },
    
    /**
     * End the current shuffle session
     */
    endSession() {
      this.sessionActive = false;
      this.shuffledActivities = [];
      this.currentIndex = 0;
    }
  };
  
  // Helper function to escape HTML
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  // Add shuffle mode animation CSS
  if (!document.querySelector('#shuffle-mode-styles')) {
    const style = document.createElement('style');
    style.id = 'shuffle-mode-styles';
    style.textContent = `
      /* Shuffle Mode Animations */
      @keyframes shuffle-slide-in {
        0% {
          transform: translateX(40px) translateZ(0);
          opacity: 0;
        }
        100% {
          transform: translateX(0) translateZ(0);
          opacity: 1;
        }
      }
      
      @keyframes fade-in {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
      
      .shuffle-slide-in {
        animation: shuffle-slide-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      
      .fade-in {
        animation: fade-in 0.3s ease-out forwards;
      }
      
      .shuffle-mode-view {
        transform: translateZ(0);
      }
      
      .shuffle-card {
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      
      /* Hover effects with hardware acceleration */
      .shuffle-done:hover {
        transform: translateY(-2px) translateZ(0) scale(1.02);
        box-shadow: 0 6px 20px rgba(0, 192, 107, 0.3);
      }
      
      .shuffle-next:hover {
        transform: translateY(-2px) translateZ(0) scale(1.02);
      }
      
      .shuffle-now:hover {
        background: linear-gradient(135deg, rgba(0, 230, 166, 0.25), rgba(46, 127, 232, 0.25));
        border-color: rgba(0, 230, 166, 0.5);
        transform: translateY(-2px) translateZ(0);
        box-shadow: 0 4px 16px rgba(0, 230, 166, 0.3);
      }
      
      .shuffle-now:active {
        transform: scale(0.98) translateZ(0);
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .shuffle-slide-in,
        .fade-in {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        .shuffle-done:hover,
        .shuffle-next:hover,
        .shuffle-now:hover {
          transform: none;
        }
        
        .shuffle-now:active {
          transform: none;
        }
      }
      
      /* Smooth scrolling with momentum */
      .shuffle-mode-view {
        -webkit-overflow-scrolling: touch;
      }
    `;
    document.head.appendChild(style);
  }
  
})();
