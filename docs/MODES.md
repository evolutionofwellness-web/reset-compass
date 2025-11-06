# Modes Dataset Documentation

## Overview

The Reset Compass app uses four wellness modes to help users understand their current state and choose appropriate reset activities. This document explains where to find the modes data and how to use it in your code.

## The Four Modes

1. **Surviving** (ID: 1) - 🩺
   - When you're running on empty. Use the simplest resets that bring you back to life.
   - Color: `#A94747` (muted red)
   - Quote: "Do the least that helps the most."

2. **Drifting** (ID: 2) - 🧭
   - You're okay but unfocused. Gently reconnect with what matters.
   - Color: `#E6B450` (warm yellow)
   - Quote: "Small steps steer the ship."

3. **Grounded** (ID: 3) - 🌿
   - You're stable and want steady progress without burnout.
   - Color: `#3B755F` (earthy green)
   - Quote: "Consistency beats intensity."
   - **Note:** This is the default mode.

4. **Growing** (ID: 4) - 🚀
   - You're ready to expand capacity intentionally and celebrate progress.
   - Color: `#4C7EDC` (vibrant blue)
   - Quote: "Build from a full tank."

## Source of Truth

The **CSV file** is the canonical source of truth for mode data:

```
data/Reset Compass App Data - Modes.csv
```

The JSON representation at `data/modes.json` is derived from the CSV and used by the TypeScript module for convenience.

## How to Use Modes in Your Code

### TypeScript/JavaScript

Import from the central modes module:

```typescript
import { MODES, getModeById, getDefaultMode, type Mode } from '@/lib/modes';

// Get all modes
const allModes = MODES;
console.log(allModes); // Array of 4 Mode objects

// Get a specific mode by ID
const survivingMode = getModeById(1);
const driftingMode = getModeById(2);
const groundedMode = getModeById(3);
const growingMode = getModeById(4);

// Get the default mode (Grounded)
const defaultMode = getDefaultMode();
console.log(defaultMode.name); // "Grounded"

// Access mode properties
if (survivingMode) {
  console.log(survivingMode.icon);         // "🩺"
  console.log(survivingMode.name);         // "Surviving"
  console.log(survivingMode.description);  // "When you're running on empty..."
  console.log(survivingMode.color);        // "#A94747"
  console.log(survivingMode.defaultQuote); // "Do the least that helps the most."
}
```

### Mode Type

The `Mode` type is defined as:

```typescript
type Mode = {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  defaultQuote: string;
};
```

### React Component Example

See `src/components/ModeBadge.tsx` for a reference implementation:

```tsx
import { ModeBadge } from '@/components/ModeBadge';
import { getModeById } from '@/lib/modes';

function MyComponent() {
  const currentMode = getModeById(3); // Grounded
  
  return (
    <div>
      <h1>Your Current Mode</h1>
      <ModeBadge mode={currentMode} />
    </div>
  );
}
```

### Rendering All Modes

```tsx
import { MODES } from '@/lib/modes';

function ModeSelector() {
  return (
    <div>
      {MODES.map(mode => (
        <div 
          key={mode.id}
          style={{ backgroundColor: mode.color }}
        >
          <span>{mode.icon}</span>
          <h3>{mode.name}</h3>
          <p>{mode.description}</p>
          <blockquote>{mode.defaultQuote}</blockquote>
        </div>
      ))}
    </div>
  );
}
```

## File Locations

- **CSV (source of truth):** `data/Reset Compass App Data - Modes.csv`
- **JSON representation:** `data/modes.json`
- **TypeScript module:** `src/lib/modes.ts`
- **Example component:** `src/components/ModeBadge.tsx`
- **Documentation:** `docs/MODES.md` (this file)

## Best Practices

1. **Always import from `src/lib/modes.ts`** - Never hard-code mode data in your components
2. **Use `getModeById(id)`** when you know the mode ID
3. **Use `getDefaultMode()`** when you need a fallback mode
4. **The CSV is the source** - If you need to update mode data, edit the CSV first, then regenerate the JSON
5. **Preserve emojis and quotes** - The icons and quotes are important for user experience

## Updating Mode Data

If you need to update mode information:

1. Edit `data/Reset Compass App Data - Modes.csv`
2. Regenerate `data/modes.json` from the CSV
3. The TypeScript module will automatically use the updated data

## Questions?

The modes dataset is designed to be simple and consistent. If you have questions about using modes in your code, refer to:

- The examples in this document
- The `ModeBadge.tsx` component for a working example
- The inline documentation in `src/lib/modes.ts`
