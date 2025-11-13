// js/shuffle.js
// Fisher-Yates shuffle algorithm and ShuffleSession management
// Provides non-repeating activity shuffling until deck exhaustion

(function(){
  'use strict';

  /**
   * Fisher-Yates shuffle algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} - New shuffled array (does not mutate original)
   */
  function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * ShuffleSession - Manages ephemeral shuffle state
   * Activities won't repeat until deck is exhausted unless allowRepeat is enabled
   */
  class ShuffleSession {
    constructor(activities, options = {}) {
      this.originalActivities = [...activities];
      this.allowRepeat = options.allowRepeat || false;
      this.shuffledDeck = shuffle(this.originalActivities);
      this.currentIndex = 0;
      this.history = [];
    }

    /**
     * Get the current activity without advancing
     * @returns {Object|null} Current activity or null if deck is empty
     */
    current() {
      if (this.shuffledDeck.length === 0) return null;
      return this.shuffledDeck[this.currentIndex];
    }

    /**
     * Move to next activity
     * @returns {Object|null} Next activity or null if deck exhausted
     */
    next() {
      if (this.shuffledDeck.length === 0) return null;

      // Add current to history
      if (this.current()) {
        this.history.push(this.current());
      }

      this.currentIndex++;

      // If we've exhausted the deck
      if (this.currentIndex >= this.shuffledDeck.length) {
        if (this.allowRepeat) {
          // Re-shuffle and start over
          this.shuffledDeck = shuffle(this.originalActivities);
          this.currentIndex = 0;
        } else {
          // Stay at last item, user must reset manually
          this.currentIndex = this.shuffledDeck.length - 1;
          return this.current(); // Indicate exhaustion, but return last item
        }
      }

      return this.current();
    }

    /**
     * Move to previous activity (if available in history)
     * @returns {Object|null} Previous activity or null
     */
    previous() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        return this.current();
      }
      return null;
    }

    /**
     * Reset the shuffle session
     */
    reset() {
      this.shuffledDeck = shuffle(this.originalActivities);
      this.currentIndex = 0;
      this.history = [];
    }

    /**
     * Toggle allow repeat setting
     * @param {boolean} value - New value for allowRepeat
     */
    setAllowRepeat(value) {
      this.allowRepeat = value;
    }

    /**
     * Get session stats
     * @returns {Object} Session statistics
     */
    getStats() {
      return {
        total: this.shuffledDeck.length,
        current: this.currentIndex + 1,
        remaining: this.shuffledDeck.length - this.currentIndex - 1,
        viewed: this.history.length,
        isExhausted: this.currentIndex >= this.shuffledDeck.length - 1 && !this.allowRepeat
      };
    }
  }

  // Export to global scope
  window.shuffle = shuffle;
  window.ShuffleSession = ShuffleSession;

})();
