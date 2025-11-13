// js/mode-activity-view.js
// Displays one random activity from a mode at a time
// TODO: add icon support once icons are added to data/activities.json

(function(){
  'use strict';

  // Module to show a single random activity from a mode
  window.ModeActivityView = {
    currentActivity: null,
    currentMode: null,
    activities: [],
    
    /**
     * Initialize and show mode activity view
     * @param {Object} options
     * @param {string} options.mode - Mode ID (surviving, drifting, grounded, growing)
     * @param {Function} options.playAnimation - Optional async function to play animation
     * @param {Function} options.logActivity - Function to log activity completion
     * @param {Function} options.onClose - Optional function called when view closes
     */
    async init(options) {
      this.currentMode = options.mode;
      this.logActivity = options.logActivity;
      this.onClose = options.onClose;
      
      // Load activities for this mode
      try {
        const response = await fetch('data/activities.json');
        const data = await response.json();
        this.activities = data.modes[options.mode] || [];
        
        if (this.activities.length === 0) {
          console.error('No activities found for mode:', options.mode);
          return;
        }
        
        // Play animation if provided
        if (options.playAnimation && typeof options.playAnimation === 'function') {
          await options.playAnimation();
        } else {
          // Small delay to mimic animation
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // Show random activity
        this.showRandomActivity();
        
      } catch (error) {
        console.error('Failed to load activities:', error);
      }
    },
    
    /**
     * Pick and display a random activity
     */
    showRandomActivity() {
      if (!this.activities || this.activities.length === 0) return;
      
      // Pick random activity (avoid showing same one twice in a row if possible)
      let newActivity;
      if (this.activities.length > 1) {
        do {
          newActivity = this.activities[Math.floor(Math.random() * this.activities.length)];
        } while (newActivity.id === (this.currentActivity?.id) && this.activities.length > 1);
      } else {
        newActivity = this.activities[0];
      }
      
      this.currentActivity = newActivity;
      this.render();
    },
    
    /**
     * Render the activity view in the existing modal
     */
    render() {
      const dialogQuickWins = document.getElementById('dialogQuickWins');
      if (!dialogQuickWins) return;
      
      const activity = this.currentActivity;
      
      // Render single activity with pop-in animation
      dialogQuickWins.innerHTML = `
        <li class="single-activity-view" style="animation: popIn 0.3s ease-out; list-style: none;">
          <div class="activity-card" style="
            background: var(--bg-elevated);
            border: 2px solid var(--border-color);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          ">
            ${activity.icon ? `<div class="activity-icon" style="font-size: 48px; margin-bottom: 16px;">${activity.icon}</div>` : ''}
            <div class="activity-text" style="
              font-size: 20px;
              font-weight: 600;
              color: var(--text-primary);
              margin-bottom: 16px;
              line-height: 1.4;
            ">${escapeHtml(activity.text)}</div>
            <div class="activity-actions" style="
              display: flex;
              gap: 12px;
              justify-content: center;
              flex-wrap: wrap;
              margin-top: 20px;
            ">
              <button class="btn-primary mode-activity-done" style="
                flex: 1;
                min-width: 120px;
                max-width: 200px;
              ">
                <span class="btn-icon">✓</span>
                <span class="btn-text">Done</span>
              </button>
              <button class="btn-secondary mode-activity-new" style="
                flex: 1;
                min-width: 120px;
                max-width: 200px;
              ">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">New One</span>
              </button>
            </div>
          </div>
          <textarea class="activity-note" placeholder="Add notes (optional)" style="
            width: 100%;
            margin-top: 16px;
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
        </li>
      `;
      
      // Wire up event listeners
      this.wireEvents();
    },
    
    /**
     * Wire up event listeners for buttons
     */
    wireEvents() {
      const doneBtn = document.querySelector('.mode-activity-done');
      const newBtn = document.querySelector('.mode-activity-new');
      
      if (doneBtn) {
        doneBtn.addEventListener('click', () => this.handleDone());
      }
      
      if (newBtn) {
        newBtn.addEventListener('click', () => this.showRandomActivity());
      }
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
          type: 'mode',
          mode: this.currentMode,
          activity: this.currentActivity,
          timestamp: new Date().toISOString(),
          note: note
        };
        
        this.logActivity(payload);
      }
      
      // Call onClose if provided
      if (this.onClose) {
        this.onClose();
      }
    }
  };
  
  // Helper function to escape HTML
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  // Add pop-in animation CSS if not already present
  if (!document.querySelector('#mode-activity-view-styles')) {
    const style = document.createElement('style');
    style.id = 'mode-activity-view-styles';
    style.textContent = `
      @keyframes popIn {
        0% {
          transform: scale(0.8);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      .single-activity-view {
        animation: popIn 0.3s ease-out;
      }
      
      .activity-card {
        transition: transform 0.2s ease;
      }
      
      .activity-card:hover {
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(style);
  }
  
})();
