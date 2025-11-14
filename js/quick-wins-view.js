// js/quick-wins-view.js
// Shows Quick Wins one at a time with shuffle and "New One" button
// TODO: add icon support once icons are added to data/activities.json

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
        // Load Quick Wins
        const response = await fetch('data/activities.json');
        const data = await response.json();
        const quickWins = data.quickWins || [];
        
        if (quickWins.length === 0) {
          console.error('No Quick Wins found');
          return;
        }
        
        // Shuffle the activities
        this.shuffledActivities = this.shuffle([...quickWins]);
        this.currentIndex = 0;
        
        // Show first Quick Win
        this.showCurrentQuickWin();
        
      } catch (error) {
        console.error('Failed to load Quick Wins:', error);
      }
    },
    
    /**
     * Fisher-Yates shuffle algorithm
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
     * Show the current Quick Win
     */
    showCurrentQuickWin() {
      if (!this.shuffledActivities || this.shuffledActivities.length === 0) return;
      
      const activity = this.shuffledActivities[this.currentIndex];
      this.render(activity);
    },
    
    /**
     * Move to next Quick Win
     */
    nextQuickWin() {
      this.currentIndex = (this.currentIndex + 1) % this.shuffledActivities.length;
      
      // If we've cycled through all, re-shuffle
      if (this.currentIndex === 0) {
        this.shuffledActivities = this.shuffle(this.shuffledActivities);
      }
      
      this.showCurrentQuickWin();
    },
    
    /**
     * Render the Quick Win view
     */
    render(activity) {
      const globalQuickWins = document.getElementById('globalQuickWins');
      if (!globalQuickWins) return;
      
      const progressText = `${this.currentIndex + 1} of ${this.shuffledActivities.length}`;
      
      // Render single Quick Win with animation
      globalQuickWins.innerHTML = `
        <li class="quick-win-single-view" style="animation: slideIn 0.3s ease-out; list-style: none;">
          <div class="quick-win-card" style="
            background: linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-primary) 100%);
            border: 2px solid rgba(255, 191, 59, 0.3);
            border-radius: 16px;
            padding: 32px 24px;
            text-align: center;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            position: relative;
            overflow: hidden;
          ">
            <div class="quick-win-badge" style="
              position: absolute;
              top: 12px;
              right: 12px;
              background: rgba(255, 191, 59, 0.2);
              color: #FFBF3B;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            ">⚡ Quick Win</div>
            
            ${activity.icon ? `<div class="quick-win-icon" style="font-size: 56px; margin-bottom: 20px; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));">${activity.icon}</div>` : '<div style="height: 20px;"></div>'}
            
            <div class="quick-win-text" style="
              font-size: 22px;
              font-weight: 700;
              color: var(--text-primary);
              margin-bottom: 20px;
              line-height: 1.5;
              text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            ">${escapeHtml(activity.text)}</div>
            
            <div class="quick-win-tip" style="
              background: rgba(255, 191, 59, 0.1);
              border-left: 3px solid #FFBF3B;
              padding: 12px 16px;
              border-radius: 8px;
              font-size: 14px;
              color: var(--text-secondary);
              margin-bottom: 24px;
              text-align: left;
            ">
              💡 <strong>Tip:</strong> Quick Wins are logged automatically and don't count toward your daily mode limit!
            </div>
            
            <div class="quick-win-actions" style="
              display: flex;
              gap: 12px;
              justify-content: center;
              flex-wrap: wrap;
            ">
              <button class="btn-primary quick-win-done" style="
                flex: 1;
                min-width: 140px;
                max-width: 220px;
                background: linear-gradient(135deg, #00c06b 0%, #0FBF84 100%);
                border: none;
                box-shadow: 0 4px 12px rgba(0, 192, 107, 0.3);
              ">
                <span class="btn-icon">✓</span>
                <span class="btn-text">Done!</span>
              </button>
              <button class="btn-secondary quick-win-new" style="
                flex: 1;
                min-width: 140px;
                max-width: 220px;
              ">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">New One</span>
              </button>
            </div>
          </div>
        </li>
      `;
      
      // Wire up event listeners
      this.wireEvents();
    },
    
    /**
     * Wire up event listeners
     */
    wireEvents() {
      const doneBtn = document.querySelector('.quick-win-done');
      const newBtn = document.querySelector('.quick-win-new');
      
      if (doneBtn) {
        doneBtn.addEventListener('click', () => this.handleDone());
      }
      
      if (newBtn) {
        newBtn.addEventListener('click', () => this.nextQuickWin());
      }
    },
    
    /**
     * Handle Done button - log and move to next
     */
    handleDone() {
      const activity = this.shuffledActivities[this.currentIndex];
      
      // Log the Quick Win
      if (this.logActivity) {
        const payload = {
          type: 'quickwin',
          activity: activity,
          timestamp: new Date().toISOString()
        };
        
        this.logActivity(payload);
      }
      
      // Move to next Quick Win
      this.nextQuickWin();
      
      // Show toast notification
      if (window.showToast) {
        window.showToast('Quick Win logged! ⚡');
      }
    }
  };
  
  // Helper function to escape HTML
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  // Add animation CSS if not already present
  if (!document.querySelector('#quick-wins-view-styles')) {
    const style = document.createElement('style');
    style.id = 'quick-wins-view-styles';
    style.textContent = `
      @keyframes slideIn {
        0% {
          transform: translateX(20px);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .quick-win-single-view {
        animation: slideIn 0.3s ease-out;
      }
      
      .quick-win-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .quick-win-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.2);
      }
      
      .quick-win-done:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 192, 107, 0.4) !important;
      }
      
      .quick-win-new:hover {
        transform: scale(1.05);
      }
      
      .quick-win-badge {
        animation: pulse 2s ease-in-out infinite;
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
})();
