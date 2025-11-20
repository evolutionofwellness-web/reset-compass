// js/quick-wins-view.js
// Shows Quick Wins one at a time with shuffle and "New One" button
// Enhanced with error handling and fallbacks

(function(){
  'use strict';

  // Module to show Quick Wins in a shuffled, one-at-a-time view
  window.QuickWinsView = {
    shuffledActivities: [],
    currentIndex: 0,
    logActivity: null,
    
    /**
     * Initialize and show Quick Wins view
     * @param {Object} options
     * @param {Function} options.logActivity - Function to log activity completion
     */
    async init(options) {
      this.logActivity = options.logActivity;
      
      try {
        let quickWins = [];
        
        // Try to use globally loaded ACTIVITIES first (preferred)
        if (window.ACTIVITIES && window.ACTIVITIES.quickWins && window.ACTIVITIES.quickWins.length > 0) {
          quickWins = window.ACTIVITIES.quickWins;
          console.log('[QuickWinsView] Using globally loaded Quick Wins:', quickWins.length);
        } else {
          // Fallback: Load Quick Wins directly
          console.log('[QuickWinsView] Loading Quick Wins from activities.json');
          const response = await fetch('/data/activities.json', {cache: 'no-store'});
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          quickWins = data.quickWins || [];
        }
        
        if (quickWins.length === 0) {
          console.error('[QuickWinsView] No Quick Wins found');
          this.showError('No Quick Wins available');
          return;
        }
        
        console.log('[QuickWinsView] Loaded', quickWins.length, 'Quick Wins');
        
        // Shuffle the activities
        this.shuffledActivities = this.shuffle([...quickWins]);
        this.currentIndex = 0;
        
        // Show first Quick Win
        this.showCurrentQuickWin();
        
      } catch (error) {
        console.error('[QuickWinsView] Failed to load Quick Wins:', error);
        this.showError('Failed to load Quick Wins. Please try again.');
      }
    },
    
    /**
     * Fisher-Yates shuffle algorithm
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffle(array) {
      try {
        if (!Array.isArray(array) || array.length === 0) {
          console.error('[QuickWinsView] Invalid array for shuffling');
          return array;
        }
        
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        console.log('[QuickWinsView] Shuffled', shuffled.length, 'activities');
        return shuffled;
      } catch (error) {
        console.error('[QuickWinsView] Shuffle error:', error);
        return array;
      }
    },
    
    /**
     * Show the current Quick Win
     */
    showCurrentQuickWin() {
      try {
        if (!this.shuffledActivities || this.shuffledActivities.length === 0) {
          console.error('[QuickWinsView] No activities to display');
          this.showError('No Quick Wins available');
          return;
        }

        const activity = this.shuffledActivities[this.currentIndex];
        if (!activity) {
          console.error('[QuickWinsView] Invalid activity at index', this.currentIndex);
          this.showError('Unable to load Quick Win');
          return;
        }

        // Validate activity has required text or title
        if (!activity.text && !activity.title) {
          console.error('[QuickWinsView] Activity missing text/title:', activity);
          this.showError('Quick Win data is incomplete');
          return;
        }

        // Validate duration if present (Quick Wins should be under 60 seconds)
        if (activity.duration !== undefined) {
          if (typeof activity.duration !== 'number' || activity.duration < 0) {
            console.warn('[QuickWinsView] Invalid duration for Quick Win:', activity.id, activity.duration);
            activity.duration = null;
          } else if (activity.duration > 60) {
            console.warn('[QuickWinsView] Quick Win duration exceeds 60 seconds:', activity.id, activity.duration);
            // Still allow it but log warning
          }
        }

        this.render(activity);
      } catch (error) {
        console.error('[QuickWinsView] Error showing Quick Win:', error);
        this.showError('Failed to display Quick Win');
      }
    },
    
    /**
     * Move to next Quick Win
     */
    nextQuickWin() {
      try {
        this.currentIndex = (this.currentIndex + 1) % this.shuffledActivities.length;
        
        // If we've cycled through all, re-shuffle
        if (this.currentIndex === 0) {
          console.log('[QuickWinsView] Cycling complete, reshuffling');
          this.shuffledActivities = this.shuffle(this.shuffledActivities);
        }
        
        this.showCurrentQuickWin();
      } catch (error) {
        console.error('[QuickWinsView] Error moving to next Quick Win:', error);
        this.showError('Failed to load next Quick Win');
      }
    },
    
    /**
     * Render the Quick Win view
     */
    render(activity) {
      try {
        const globalQuickWins = document.getElementById('globalQuickWins');
        if (!globalQuickWins) {
          console.error('[QuickWinsView] globalQuickWins element not found');
          return;
        }
        
        if (!activity || (!activity.text && !activity.title)) {
          console.error('[QuickWinsView] Invalid activity object');
          this.showError('Invalid Quick Win data');
          return;
        }
        
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const animationClass = reducedMotion ? 'fade-in' : 'quick-win-slide-in';
        
        // Render single Quick Win with animation
        globalQuickWins.innerHTML = `
          <li class="quick-win-single-view ${animationClass}" style="list-style: none;">
            <div class="quick-win-card" style="
              background: linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-primary) 100%);
              border: 2px solid rgba(255, 191, 59, 0.3);
              border-radius: 16px;
              padding: 32px 24px;
              text-align: center;
              box-shadow: 0 8px 24px rgba(255, 191, 59, 0.2);
              transform: translateZ(0);
            ">
              ${activity.icon && !activity.icon.includes('/') && !activity.icon.includes('.') ? `<div class="quick-win-icon" style="font-size: 56px; margin-bottom: 20px;">${activity.icon}</div>` : ''}

              <div class="quick-win-text" style="
                font-size: 20px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 12px;
                line-height: 1.5;
                min-height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">${escapeHtml(activity.title || activity.text)}</div>

              ${activity.explain ? `<div class="quick-win-explain" style="
                font-size: 14px;
                color: var(--text-secondary);
                margin-bottom: 12px;
                line-height: 1.5;
                padding: 12px;
                background: rgba(255, 191, 59, 0.05);
                border-radius: 8px;
              ">${escapeHtml(activity.explain)}</div>` : ''}

              ${activity.duration ? `<div class="quick-win-duration" style="
                font-size: 12px;
                color: var(--text-tertiary);
                margin-bottom: 16px;
                font-weight: 500;
              ">⚡ ${formatDuration(activity.duration)}</div>` : ''}
              
              <div class="quick-win-actions" style="
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
              ">
                <button class="btn-primary quick-win-done" style="
                  flex: 1;
                  min-width: 130px;
                  max-width: 200px;
                  transform: translateZ(0);
                  transition: transform 0.2s ease, box-shadow 0.2s ease;
                ">
                  <span class="btn-icon">✓</span>
                  <span class="btn-text">Done</span>
                </button>
                <button class="btn-secondary quick-win-next" style="
                  flex: 1;
                  min-width: 130px;
                  max-width: 200px;
                  transform: translateZ(0);
                  transition: transform 0.2s ease;
                ">
                  <span class="btn-icon">→</span>
                  <span class="btn-text">New One</span>
                </button>
              </div>
            </div>
            
            <div class="quick-wins-tip" style="
              text-align: center;
              margin-top: 20px;
              padding: 16px;
              background: rgba(255, 191, 59, 0.1);
              border-radius: 10px;
              font-size: 14px;
              color: var(--text-secondary);
            ">
              <strong style="color: var(--text-primary);">💡 Tip:</strong> Quick Wins have no limit - do as many as you want!
            </div>
          </li>
        `;
        
        // Wire up event listeners
        this.wireEvents();
      } catch (error) {
        console.error('[QuickWinsView] Render error:', error);
        this.showError('Failed to render Quick Win');
      }
    },
    
    /**
     * Wire up event listeners for buttons
     */
    wireEvents() {
      try {
        const doneBtn = document.querySelector('.quick-win-done');
        const nextBtn = document.querySelector('.quick-win-next');
        
        if (doneBtn) {
          doneBtn.addEventListener('click', () => this.handleDone());
        }
        
        if (nextBtn) {
          nextBtn.addEventListener('click', () => this.nextQuickWin());
        }
      } catch (error) {
        console.error('[QuickWinsView] Error wiring events:', error);
      }
    },
    
    /**
     * Handle Done button click
     */
    handleDone() {
      try {
        const activity = this.shuffledActivities[this.currentIndex];
        
        if (!activity) {
          console.error('[QuickWinsView] No activity to log');
          this.showError('Unable to save Quick Win');
          return;
        }
        
        // Call logActivity with standardized payload
        if (this.logActivity && typeof this.logActivity === 'function') {
          const payload = {
            type: 'quickwin',
            activity: activity,
            timestamp: new Date().toISOString()
          };
          
          this.logActivity(payload);
        } else {
          console.warn('[QuickWinsView] logActivity callback not provided');
        }
        
        // Move to next Quick Win automatically
        this.nextQuickWin();
        
        // Show toast notification
        if (window.showToast) {
          window.showToast('Quick Win logged! ⚡');
        }
      } catch (error) {
        console.error('[QuickWinsView] Error handling done:', error);
        this.showError('Failed to complete Quick Win');
      }
    },
    
    /**
     * Display error message to user
     */
    showError(message) {
      try {
        const globalQuickWins = document.getElementById('globalQuickWins');
        if (!globalQuickWins) {
          console.error('[QuickWinsView] Cannot show error: globalQuickWins not found');
          return;
        }
        
        globalQuickWins.innerHTML = `
          <li style="list-style: none; text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px;">
              ${escapeHtml(message)}
            </div>
            <div style="font-size: 14px; color: var(--text-secondary);">
              Please try again or contact support if the problem persists.
            </div>
          </li>
        `;
        
        // Use global toast if available
        if (window.showToast) {
          window.showToast(message);
        }
      } catch (error) {
        console.error('[QuickWinsView] Error showing error message:', error);
      }
    }
  };
  
  // Helper function to escape HTML
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Helper function to format duration in seconds to human-readable time
  function formatDuration(seconds) {
    if (!seconds || seconds < 0) return 'unknown time';
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 120) return '1 minute';
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
  }
  
  // Add Quick Wins animation CSS if not already present
  if (!document.querySelector('#quick-wins-view-styles')) {
    const style = document.createElement('style');
    style.id = 'quick-wins-view-styles';
    style.textContent = `
      @keyframes quick-win-slide-in {
        0% {
          transform: translateY(20px);
          opacity: 0;
        }
        100% {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .quick-win-slide-in {
        animation: quick-win-slide-in 0.3s ease-out;
      }
      
      .fade-in {
        animation: fade-in 0.3s ease-out;
      }
      
      @keyframes fade-in {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
      
      .quick-win-single-view {
        transform: translateZ(0);
      }
      
      .quick-win-card {
        transform: translateZ(0);
        backface-visibility: hidden;
      }
      
      /* Hover effects */
      .quick-win-done:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 20px rgba(255, 191, 59, 0.3);
      }
      
      .quick-win-next:hover {
        transform: translateY(-2px) scale(1.02);
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .quick-win-slide-in,
        .fade-in {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        .quick-win-done:hover,
        .quick-win-next:hover {
          transform: none;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
})();
