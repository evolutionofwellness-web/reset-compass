# Shuffle Mode QA Checklist

## Pre-Deployment Testing Checklist

### Functional Tests

#### Shuffle Mode Core
- [ ] Shuffle Mode button appears on main page
- [ ] Clicking "Enter Shuffle Mode" opens the dialog
- [ ] Dialog displays instructional header with clear explanation
- [ ] "Shuffle Now" button reshuffles activities
- [ ] Activities are presented in random order
- [ ] Fisher-Yates shuffle produces different orders each time
- [ ] Deck does not repeat until exhausted (default behavior)

#### Navigation
- [ ] "Next" button advances to next activity
- [ ] "Previous" button goes back to previous activity
- [ ] Previous button is disabled on first activity
- [ ] Next button is disabled on last activity (when repeat is off)
- [ ] Arrow keys (left/right) navigate activities
- [ ] Swipe left advances to next activity
- [ ] Swipe right goes to previous activity

#### Allow Repeat Toggle
- [ ] Toggle is present and clearly labeled
- [ ] Toggle defaults to OFF
- [ ] When toggled ON, deck reshuffles after exhaustion
- [ ] When toggled ON, Next button becomes enabled at end
- [ ] Toggle state affects navigation behavior correctly

#### Progress Tracking
- [ ] Progress bar shows current position in deck
- [ ] Progress text shows "Activity X of Y"
- [ ] Progress updates correctly on navigation
- [ ] Progress percentage is accurate

#### Activity Completion
- [ ] "Complete This Activity" button is functional
- [ ] Completing activity records it in history
- [ ] Activity appears in history with correct mode info
- [ ] Completion updates streak if applicable

#### Deck Exhaustion
- [ ] Completion message shows when deck is exhausted
- [ ] Option to enable repeat is presented
- [ ] Close button works correctly
- [ ] Can reshuffle from completion screen

### UI/UX Tests

#### Visual Design
- [ ] Dialog is properly styled and matches app theme
- [ ] Activity cards are visually appealing
- [ ] Mode badges show correct colors
- [ ] Icons display correctly (if available)
- [ ] Spacing is consistent throughout
- [ ] Typography is readable and accessible

#### Responsive Design
- [ ] Dialog works on mobile (320px-480px)
- [ ] Dialog works on tablet (481px-768px)
- [ ] Dialog works on desktop (769px+)
- [ ] Touch gestures work on mobile devices
- [ ] Buttons are appropriately sized for touch

#### Animations
- [ ] Card transitions are smooth (300-450ms)
- [ ] Slide-in animations work for next/previous
- [ ] Fade-in animation works for shuffle
- [ ] Bounce animation works on completion icon
- [ ] Animations are hardware-accelerated
- [ ] No jank or stuttering

#### Reduced Motion
- [ ] prefers-reduced-motion is detected
- [ ] Animations are disabled when motion is reduced
- [ ] Transitions are instant (0.01ms)
- [ ] Functionality still works without animations

### Accessibility Tests

#### Keyboard Navigation
- [ ] Tab order is logical
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Escape key closes dialog
- [ ] Focus trap keeps focus within dialog

#### Screen Readers
- [ ] Dialog has proper ARIA labels
- [ ] Activity content is announced correctly
- [ ] Button purposes are clear
- [ ] Progress updates are announced
- [ ] Mode badges are properly labeled

#### Focus Management
- [ ] Focus moves to dialog when opened
- [ ] Focus trap is activated on open
- [ ] Focus returns to trigger on close
- [ ] No focus leaks outside dialog

### Scrollability Tests

#### Dialog Scrolling
- [ ] Long content scrolls vertically
- [ ] max-height uses calc(100vh - 48px)
- [ ] Safe-area insets are applied on mobile
- [ ] Momentum scrolling works (-webkit-overflow-scrolling: touch)
- [ ] No double scrollbars
- [ ] Backdrop doesn't scroll

### Performance Tests

#### Load Time
- [ ] Scripts load without blocking
- [ ] No console errors on page load
- [ ] Modules initialize correctly
- [ ] Focus-trap library loads properly

#### Runtime Performance
- [ ] Shuffle operations are fast (<100ms)
- [ ] Navigation is responsive
- [ ] No memory leaks on repeated use
- [ ] Animations run at 60fps

### Integration Tests

#### Existing Features
- [ ] Mode dialogs still work correctly
- [ ] Quick Wins dialog still works
- [ ] History tracking still functions
- [ ] Streak system unaffected
- [ ] Achievement system works

#### Data Flow
- [ ] Activities are loaded from modes.json
- [ ] Activity completion integrates with history
- [ ] Mode colors are preserved
- [ ] Activity metadata is accurate

### Removal of "View all activities"

#### Code Search
- [ ] No "View all activities" strings in HTML
- [ ] No "View all activities" strings in JS
- [ ] No "View all activities" strings in CSS
- [ ] Test confirms absence of string

#### Navigation
- [ ] No buttons/links lead to full activity list view
- [ ] Mode activity view links to Shuffle Mode instead
- [ ] All activity discovery paths lead to Shuffle Mode

### Browser Compatibility

#### Desktop Browsers
- [ ] Chrome/Edge 90+ works correctly
- [ ] Firefox 88+ works correctly
- [ ] Safari 14+ works correctly

#### Mobile Browsers
- [ ] iOS Safari 14+ works correctly
- [ ] Android Chrome 90+ works correctly
- [ ] Touch interactions work properly

### Error Handling

#### Edge Cases
- [ ] Handles empty activity list gracefully
- [ ] Handles missing mode data
- [ ] Handles network failures
- [ ] Shows appropriate error messages

## Post-Deployment Verification

- [ ] Feature deploys successfully
- [ ] No console errors in production
- [ ] Analytics show feature usage
- [ ] No user-reported bugs
- [ ] Performance metrics acceptable

## Notes

Add any observations, issues, or concerns below:

---

**Tested By:** _________________
**Date:** _________________
**Environment:** _________________
**Status:** ☐ PASS  ☐ FAIL  ☐ PENDING
