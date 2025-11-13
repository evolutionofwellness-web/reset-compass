// shuffle-mode.js - Shuffle Mode implementation with Fisher-Yates algorithm
// Presents activities in random order without repeating until deck exhausted

(function() {
  'use strict';

  // Fisher-Yates shuffle algorithm
  function fisherYatesShuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Shuffle session state
  let shuffleSession = {
    deck: [],
    currentIndex: 0,
    allowRepeat: false,
    isActive: false
  };

  // Get all activities from all modes
  function getAllActivities() {
    if (!window.MODES || !window.MODES.length) return [];
    
    const allActivities = [];
    window.MODES.forEach(mode => {
      if (mode.activities && Array.isArray(mode.activities)) {
        mode.activities.forEach(activity => {
          allActivities.push({
            ...activity,
            modeName: mode.title,
            modeColor: mode.color,
            modeId: mode.id
          });
        });
      }
    });
    return allActivities;
  }

  // Initialize a new shuffle session
  function initializeSession(allowRepeat = false) {
    const activities = getAllActivities();
    shuffleSession = {
      deck: fisherYatesShuffle(activities),
      currentIndex: 0,
      allowRepeat: allowRepeat,
      isActive: true
    };
    return shuffleSession.deck.length > 0;
  }

  // Get current activity
  function getCurrentActivity() {
    if (!shuffleSession.isActive || shuffleSession.deck.length === 0) {
      return null;
    }
    return shuffleSession.deck[shuffleSession.currentIndex];
  }

  // Move to next activity
  function nextActivity() {
    if (!shuffleSession.isActive || shuffleSession.deck.length === 0) {
      return null;
    }

    shuffleSession.currentIndex++;
    
    // Check if we've exhausted the deck
    if (shuffleSession.currentIndex >= shuffleSession.deck.length) {
      if (shuffleSession.allowRepeat) {
        // Reshuffle and start over
        shuffleSession.deck = fisherYatesShuffle(shuffleSession.deck);
        shuffleSession.currentIndex = 0;
      } else {
        // Deck exhausted, stay at last card
        shuffleSession.currentIndex = shuffleSession.deck.length - 1;
        return { exhausted: true, activity: getCurrentActivity() };
      }
    }
    
    return getCurrentActivity();
  }

  // Move to previous activity
  function previousActivity() {
    if (!shuffleSession.isActive || shuffleSession.deck.length === 0) {
      return null;
    }

    if (shuffleSession.currentIndex > 0) {
      shuffleSession.currentIndex--;
    }
    
    return getCurrentActivity();
  }

  // Check if deck is exhausted
  function isDeckExhausted() {
    return shuffleSession.currentIndex >= shuffleSession.deck.length - 1 && !shuffleSession.allowRepeat;
  }

  // Get progress info
  function getProgress() {
    return {
      current: shuffleSession.currentIndex + 1,
      total: shuffleSession.deck.length,
      percentage: shuffleSession.deck.length > 0 
        ? Math.round(((shuffleSession.currentIndex + 1) / shuffleSession.deck.length) * 100)
        : 0
    };
  }

  // Reshuffle the deck
  function reshuffle() {
    if (shuffleSession.deck.length === 0) {
      return initializeSession(shuffleSession.allowRepeat);
    }
    shuffleSession.deck = fisherYatesShuffle(shuffleSession.deck);
    shuffleSession.currentIndex = 0;
    return true;
  }

  // Toggle allow repeat
  function toggleAllowRepeat() {
    shuffleSession.allowRepeat = !shuffleSession.allowRepeat;
    return shuffleSession.allowRepeat;
  }

  // Reset session
  function resetSession() {
    shuffleSession = {
      deck: [],
      currentIndex: 0,
      allowRepeat: false,
      isActive: false
    };
  }

  // Export public API
  window.ShuffleMode = {
    initialize: initializeSession,
    getCurrent: getCurrentActivity,
    next: nextActivity,
    previous: previousActivity,
    reshuffle: reshuffle,
    isDeckExhausted: isDeckExhausted,
    getProgress: getProgress,
    toggleAllowRepeat: toggleAllowRepeat,
    reset: resetSession,
    getSession: () => ({ ...shuffleSession })
  };

  console.log('ShuffleMode module loaded');
})();
