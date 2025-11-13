// js/shuffle-mode.js
// Full-screen Shuffle Mode UI - Primary "All Activities" experience
// Shows activities in randomized order with shuffle session management

(function(){
  'use strict';

  /**
   * ShuffleMode - Manages the shuffle mode interface
   */
  window.ShuffleMode = {
    session: null,
    mode: null,
    activities: [],
    allowRepeat: false,
    logActivity: null,
    modal: null,
    
    /**
     * Initialize and open Shuffle Mode
     * @param {Object} options
     * @param {string} options.mode - Mode ID to load activities from
     * @param {Function} options.logActivity - Function to log completed activities
     */
    async init(options) {
      this.mode = options.mode;
      this.logActivity = options.logActivity;
      
      try {
        // Load activities for this mode
        const response = await fetch('data/activities.json');
        const data = await response.json();
        this.activities = data.modes[this.mode] || [];
        
        if (this.activities.length === 0) {
          console.error('No activities found for mode:', this.mode);
          return;
        }
        
        // Create new shuffle session
        this.session = new window.ShuffleSession(this.activities, {
          allowRepeat: this.allowRepeat
        });
        
        // Open modal with shuffle interface
        this.open();
        
      } catch (error) {
        console.error('Failed to load activities:', error);
      }
    },
    
    /**
     * Open the shuffle mode modal
     */
    open() {
      const content = this.renderContent();
      
      this.modal = new window.Modal({
        id: 'shuffle-mode-modal',
        content: content,
        ariaLabel: 'Shuffle Mode',
        closeOnBackdrop: true,
        closeOnEsc: true,
        onClose: () => {
          this.cleanup();
        }
      });
      
      this.modal.open();
      
      // Wire up events after modal is open
      requestAnimationFrame(() => {
        this.wireEvents();
      });
    },
    
    /**
     * Render shuffle mode content
     */
    renderContent() {
      const activity = this.session.current();
      const stats = this.session.getStats();
      
      if (!activity) {
        return this.renderEmptyState();
      }
      
      const modeName = this.getModeName(this.mode);
      
      return `
        <div class="shuffle-mode">
          <button class="modal-close-btn" data-action="close" aria-label="Close">&times;</button>
          
          <div class="shuffle-header">
            <h2 class="shuffle-title">🎲 Shuffle Mode: ${modeName}</h2>
            <p class="shuffle-description">
              We'll present activities in a randomized order — tap <strong>Shuffle Now</strong> or swipe to go to the next activity. 
              Activities won't repeat until the deck is exhausted.
            </p>
          </div>
          
          <div class="shuffle-controls">
            <label class="shuffle-toggle">
              <input type="checkbox" id="allowRepeatToggle" ${this.allowRepeat ? 'checked' : ''}>
              <span class="toggle-label">Allow repeat</span>
            </label>
            <div class="shuffle-stats">
              <span class="stat-badge">${stats.current} of ${stats.total}</span>
              ${stats.remaining > 0 ? `<span class="stat-text">${stats.remaining} remaining</span>` : '<span class="stat-text stat-complete">✓ Deck complete</span>'}
            </div>
          </div>
          
          <div class="shuffle-activity-container" id="shuffleActivityContainer">
            ${this.renderActivity(activity)}
          </div>
          
          <div class="shuffle-navigation">
            <button class="shuffle-nav-btn shuffle-nav-prev" data-action="previous" ${stats.current === 1 ? 'disabled' : ''}>
              <span class="nav-arrow">←</span>
              <span class="nav-label">Previous</span>
            </button>
            
            <button class="shuffle-main-btn" data-action="shuffle">
              <span class="btn-icon">🔄</span>
              <span class="btn-text">Shuffle Now</span>
            </button>
            
            <button class="shuffle-nav-btn shuffle-nav-next" data-action="next">
              <span class="nav-label">Next</span>
              <span class="nav-arrow">→</span>
            </button>
          </div>
          
          <div class="shuffle-footer">
            <p class="shuffle-hint">Use arrow keys (← →) or swipe to navigate</p>
          </div>
        </div>
      `;
    },
    
    /**
     * Render a single activity card
     */
    renderActivity(activity) {
      if (!activity) return '<p>No more activities</p>';
      
      return `
        <div class="activity-card-shuffle">
          ${activity.icon ? `<div class="activity-icon">${activity.icon}</div>` : ''}
          <div class="activity-text">${this.escapeHtml(activity.text)}</div>
          <div class="activity-actions">
            <button class="btn-primary activity-done-btn" data-action="done">
              <span class="btn-icon">✓</span>
              <span class="btn-text">Mark as Done</span>
            </button>
          </div>
          <textarea class="activity-note" placeholder="Add notes (optional)" maxlength="500"></textarea>
        </div>
      `;
    },
    
    /**
     * Render empty state when deck is exhausted
     */
    renderEmptyState() {
      return `
        <div class="shuffle-mode">
          <button class="modal-close-btn" data-action="close" aria-label="Close">&times;</button>
          <div class="shuffle-empty">
            <div class="empty-icon">🎉</div>
            <h2>Deck Complete!</h2>
            <p>You've gone through all activities in this mode.</p>
            <button class="btn-primary" data-action="reset">
              <span class="btn-icon">🔄</span>
              <span class="btn-text">Shuffle Again</span>
            </button>
          </div>
        </div>
      `;
    },
    
    /**
     * Wire up event listeners
     */
    wireEvents() {
      const container = document.getElementById('shuffle-mode-modal');
      if (!container) return;
      
      // Close button
      const closeBtn = container.querySelector('[data-action="close"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.modal.close());
      }
      
      // Shuffle button
      const shuffleBtn = container.querySelector('[data-action="shuffle"]');
      if (shuffleBtn) {
        shuffleBtn.addEventListener('click', () => this.handleShuffle());
      }
      
      // Navigation buttons
      const prevBtn = container.querySelector('[data-action="previous"]');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => this.handlePrevious());
      }
      
      const nextBtn = container.querySelector('[data-action="next"]');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.handleNext());
      }
      
      // Done button
      const doneBtn = container.querySelector('[data-action="done"]');
      if (doneBtn) {
        doneBtn.addEventListener('click', () => this.handleDone());
      }
      
      // Allow repeat toggle
      const repeatToggle = document.getElementById('allowRepeatToggle');
      if (repeatToggle) {
        repeatToggle.addEventListener('change', (e) => {
          this.allowRepeat = e.target.checked;
          this.session.setAllowRepeat(this.allowRepeat);
        });
      }
      
      // Reset button (in empty state)
      const resetBtn = container.querySelector('[data-action="reset"]');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => this.handleReset());
      }
      
      // Keyboard navigation
      document.addEventListener('keydown', this.handleKeyboard.bind(this));
      
      // Touch/swipe support
      this.initSwipeSupport(container);
    },
    
    /**
     * Handle shuffle button click
     */
    handleShuffle() {
      const next = this.session.next();
      this.updateActivity(next);
    },
    
    /**
     * Handle previous button click
     */
    handlePrevious() {
      const prev = this.session.previous();
      if (prev) {
        this.updateActivity(prev);
      }
    },
    
    /**
     * Handle next button click
     */
    handleNext() {
      const next = this.session.next();
      this.updateActivity(next);
    },
    
    /**
     * Handle done button click
     */
    handleDone() {
      const activity = this.session.current();
      if (!activity) return;
      
      const noteTextarea = document.querySelector('.activity-note');
      const note = noteTextarea ? noteTextarea.value.trim() : '';
      
      // Log the activity
      if (this.logActivity) {
        const payload = {
          type: 'mode',
          mode: this.mode,
          activity: activity,
          timestamp: new Date().toISOString(),
          note: note
        };
        
        this.logActivity(payload);
      }
      
      // Show success feedback
      if (window.showToast) {
        window.showToast('Activity completed! ✓');
      }
      
      // Move to next activity
      setTimeout(() => {
        const next = this.session.next();
        this.updateActivity(next);
      }, 300);
    },
    
    /**
     * Handle reset button click
     */
    handleReset() {
      this.session.reset();
      this.updateContent();
    },
    
    /**
     * Handle keyboard navigation
     */
    handleKeyboard(e) {
      if (!this.modal || !this.modal.isOpen) return;
      
      // Left arrow - previous
      if (e.key === 'ArrowLeft' || e.keyCode === 37) {
        e.preventDefault();
        this.handlePrevious();
      }
      
      // Right arrow - next
      if (e.key === 'ArrowRight' || e.keyCode === 39) {
        e.preventDefault();
        this.handleNext();
      }
    },
    
    /**
     * Initialize swipe gesture support
     */
    initSwipeSupport(container) {
      let touchStartX = 0;
      let touchEndX = 0;
      const threshold = 50; // Minimum swipe distance
      
      const activityContainer = container.querySelector('#shuffleActivityContainer');
      if (!activityContainer) return;
      
      activityContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      activityContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe(touchStartX, touchEndX, threshold);
      }, { passive: true });
    },
    
    /**
     * Handle swipe gesture
     */
    handleSwipe(startX, endX, threshold) {
      const diff = startX - endX;
      
      // Swipe left (next)
      if (diff > threshold) {
        this.handleNext();
      }
      
      // Swipe right (previous)
      if (diff < -threshold) {
        this.handlePrevious();
      }
    },
    
    /**
     * Update activity with animation
     */
    updateActivity(activity) {
      const container = document.getElementById('shuffleActivityContainer');
      if (!container) return;
      
      // Add exit animation
      container.classList.add('activity-exit');
      
      setTimeout(() => {
        // Update content
        if (activity) {
          container.innerHTML = this.renderActivity(activity);
        } else {
          // Deck exhausted
          this.updateContent();
        }
        
        // Remove exit class and add enter animation
        container.classList.remove('activity-exit');
        container.classList.add('activity-enter');
        
        // Update stats and buttons
        this.updateStats();
        
        // Re-wire done button
        const doneBtn = container.querySelector('[data-action="done"]');
        if (doneBtn) {
          doneBtn.addEventListener('click', () => this.handleDone());
        }
        
        // Remove enter class after animation
        setTimeout(() => {
          container.classList.remove('activity-enter');
        }, 350);
      }, 300);
    },
    
    /**
     * Update entire content (for major state changes)
     */
    updateContent() {
      if (!this.modal) return;
      
      const content = this.renderContent();
      this.modal.setContent(content);
      
      // Re-wire all events
      requestAnimationFrame(() => {
        this.wireEvents();
      });
    },
    
    /**
     * Update stats display
     */
    updateStats() {
      const stats = this.session.getStats();
      const statsContainer = document.querySelector('.shuffle-stats');
      
      if (statsContainer) {
        statsContainer.innerHTML = `
          <span class="stat-badge">${stats.current} of ${stats.total}</span>
          ${stats.remaining > 0 ? `<span class="stat-text">${stats.remaining} remaining</span>` : '<span class="stat-text stat-complete">✓ Deck complete</span>'}
        `;
      }
      
      // Update button states
      const prevBtn = document.querySelector('[data-action="previous"]');
      if (prevBtn) {
        prevBtn.disabled = stats.current === 1;
      }
    },
    
    /**
     * Get mode display name
     */
    getModeName(modeId) {
      const names = {
        surviving: 'Surviving',
        drifting: 'Drifting',
        grounded: 'Grounded',
        growing: 'Growing'
      };
      return names[modeId] || modeId;
    },
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },
    
    /**
     * Cleanup on close
     */
    cleanup() {
      // Remove keyboard listener
      document.removeEventListener('keydown', this.handleKeyboard);
      
      // Clear session
      this.session = null;
      if (this.modal && typeof this.modal.destroy === 'function') {
        this.modal.destroy();
      }
      this.modal = null;
    }
  };

})();
