# reset-compass

A wellness app that helps users understand their current state through four wellness modes and choose appropriate reset activities.

## Modes Dataset

This app uses four wellness modes:

1. **Surviving** 🩺 - When you're running on empty
2. **Drifting** 🧭 - You're okay but unfocused  
3. **Grounded** 🌿 - You're stable and want steady progress (default)
4. **Growing** 🚀 - You're ready to expand capacity

### Usage

```typescript
import { MODES, getModeById, getDefaultMode } from '@/lib/modes';

// Get the default mode (Grounded)
const defaultMode = getDefaultMode();

// Get a specific mode
const mode = getModeById(3);
```

For complete documentation, see [docs/MODES.md](docs/MODES.md).

### Files

- **Source of truth:** `data/Reset Compass App Data - Modes.csv`
- **JSON data:** `data/modes.json`
- **TypeScript module:** `src/lib/modes.ts`
- **Example component:** `src/components/ModeBadge.tsx`