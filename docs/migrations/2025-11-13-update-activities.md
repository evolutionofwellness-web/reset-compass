# Migration Guide: Activity Lists Update (2025-11-13)

## Overview

This migration introduces a comprehensive update to the activity system in The Reset Compass:

- **New Data Source:** Single source of truth at `data/activities.json`
- **Expanded Activities:** Each mode now has 30 substantial activities (up from 3)
- **Quick Wins:** 100 Quick Win activities (expandable)
- **New Modules:** Two new JavaScript modules for enhanced UX
- **Improved Logging:** Standardized activity logging format

## Changes Summary

### Data Structure

**Before:**
- Activities stored in `data/modes.json`
- 3 activities per mode
- Quick Wins embedded with mode activities

**After:**
- Activities stored in `data/activities.json`
- 30 activities per mode (surviving, drifting, grounded, growing)
- 100 dedicated Quick Wins
- Icon field added (empty, ready for designer)

### New Files

1. **data/activities.json** - Canonical activity source
2. **js/mode-activity-view.js** - Mode activity display module (one random activity at a time)
3. **js/quick-wins-view.js** - Quick Wins display module (shuffled, one at a time)
4. **docs/activity-lists.md** - Documentation reference
5. **docs/migrations/2025-11-13-update-activities.md** - This file

### Modified Files

1. **script.js** - Integration of new modules and logging
2. **js/modes-loader.js** - May need updates to load new data structure

## Migration Steps

### 1. Verify Data Files

Ensure `data/activities.json` exists and contains:
- 30 activities for each mode (surviving, drifting, grounded, growing)
- 100 Quick Win activities
- Each activity has: `id`, `text`, `icon` fields

```bash
# Verify file exists
ls -lh data/activities.json

# Check JSON is valid
node -e "console.log(JSON.parse(require('fs').readFileSync('data/activities.json')))"
```

### 2. Update Activity Loading

The app should load activities from `data/activities.json` instead of inline or from `modes.json`.

**Example:**
```javascript
// Load activities
let ACTIVITIES = {};
fetch('data/activities.json')
  .then(res => res.json())
  .then(data => {
    ACTIVITIES = data;
    // Initialize UI with activities
  });
```

### 3. Integrate Mode Activity View

The new mode activity view shows ONE random activity at a time, not a full list.

**Key Features:**
- Plays animation before showing activity (if animation function provided)
- Shows single random activity from selected mode
- "Done" button logs activity
- "View All" button shows full list
- "New One" button picks another random activity

**Integration Example:**
```javascript
// When user selects a mode
function openModeDialog(modeId) {
  // Option 1: Show single random activity with the new module
  showSingleRandomActivity(modeId);
  
  // Option 2: Show full list (existing behavior)
  // showFullActivityList(modeId);
}
```

### 4. Integrate Quick Wins View

The Quick Wins view automatically shuffles activities and shows one at a time.

**Key Features:**
- Auto-shuffles all Quick Wins on load
- Shows one Quick Win at a time
- "New One" button cycles to next shuffled item
- "Done" button logs and moves to next
- Visual indicator that Quick Wins are unlimited

**Integration Example:**
```javascript
// When user clicks Quick Wins
function openQuickWins() {
  // Use new shuffled view
  showShuffledQuickWins();
}
```

### 5. Update Logging Format

Standardize activity logging payloads:

**Mode Activity:**
```javascript
{
  type: 'mode',
  mode: 'surviving',  // mode ID
  activity: { id: 'breathe-3', text: 'Take 3 deep breaths' },
  timestamp: '2025-11-13T19:00:00.000Z'
}
```

**Quick Win:**
```javascript
{
  type: 'quickwin',
  activity: { id: 'qw-smile', text: 'Smile at yourself in a mirror' },
  timestamp: '2025-11-13T19:00:00.000Z'
}
```

Ensure existing logging functions can handle both formats and continue to:
- Update history
- Calculate streaks
- Update donut chart percentages

### 6. Animation Integration

If the app has an existing animation system:

```javascript
// Pass animation function to mode view
const modeView = new ModeActivityView({
  mode: modeId,
  playAnimation: async () => {
    await playExistingAnimation();
  },
  logActivity: (payload) => {
    recordActivity(payload);
  }
});
```

### 7. Preserve Existing Features

**IMPORTANT:** This migration should NOT break:
- Daily streak tracking
- History recording
- Donut chart updates
- Achievement system
- Light/dark mode
- Accessibility features
- Mobile-first layout

Test all existing features after integration.

## Testing Checklist

### Mode Activities
- [ ] Select a mode
- [ ] Animation plays (if implemented)
- [ ] Single random activity displays
- [ ] "Done" button logs correctly
- [ ] "View All" shows full list
- [ ] "New One" picks different activity
- [ ] Activity logged in history
- [ ] Streak increments correctly
- [ ] Donut chart updates

### Quick Wins
- [ ] Quick Wins dialog opens
- [ ] List is shuffled on load
- [ ] One Quick Win displays at a time
- [ ] "New One" cycles through shuffled list
- [ ] "Done" logs and moves to next
- [ ] Multiple Quick Wins can be completed
- [ ] No mode lockout for Quick Wins
- [ ] Activity logged in history

### Existing Features
- [ ] History dialog shows all activities
- [ ] Export history works
- [ ] Clear history works
- [ ] Theme toggle works
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Mobile layout works
- [ ] No JavaScript errors in console

## Rollback Procedure

If issues arise:

1. **Revert data file:**
   ```bash
   git checkout main -- data/modes.json
   ```

2. **Remove new modules:**
   ```bash
   rm js/mode-activity-view.js js/quick-wins-view.js
   ```

3. **Revert script.js:**
   ```bash
   git checkout main -- script.js
   ```

4. **Test existing functionality**

## Performance Notes

- **Large Lists:** 220 total activities, but only 1-2 displayed at a time
- **Memory:** Minimal increase (~17KB JSON data)
- **Rendering:** No performance impact (one item rendered vs. full list)
- **Loading:** Fetch `activities.json` once on app load, cache in memory

## Accessibility Notes

- All activities maintain 3rd-grade reading level
- Icon field prepared for future icons (will be supplementary, not replacing text)
- Single-activity view reduces cognitive load
- Shuffled Quick Wins add variety and discovery

## Future Enhancements

- Add icons to all activities (icon field prepared)
- Implement activity favorites/bookmarks
- Add activity completion analytics
- Personalized activity recommendations
- Custom user activities

## Support

For issues or questions:
1. Check console for JavaScript errors
2. Verify `activities.json` loads successfully
3. Test with browser DevTools Network tab
4. Review this migration guide

## Version Compatibility

- **Minimum Browser:** Chrome 90+, Firefox 88+, Safari 14+
- **Dependencies:** None (vanilla JavaScript)
- **Breaking Changes:** None (additive only)

---

**Migration Date:** 2025-11-13  
**Author:** Copilot Agent  
**Status:** Ready for Implementation
