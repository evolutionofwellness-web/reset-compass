/**
 * ModeBadge Component
 * 
 * A reference implementation showing how to use the MODES data
 * to render a mode with its icon, name, and color.
 * 
 * This component demonstrates:
 * - Importing MODES from src/lib/modes.ts
 * - Accessing mode properties (icon, name, color)
 * - Using mode data in a React component
 */

import React from 'react';
import { MODES, type Mode } from '../lib/modes';

interface ModeBadgeProps {
  mode?: Mode;
}

/**
 * ModeBadge renders a mode's icon, name, and uses its color for styling.
 * If no mode is provided, it uses the first mode (Surviving) as an example.
 */
export const ModeBadge: React.FC<ModeBadgeProps> = ({ mode = MODES[0] }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '20px',
        backgroundColor: mode.color,
        color: 'white',
        fontWeight: 'bold',
        fontSize: '14px',
      }}
    >
      <span style={{ fontSize: '20px' }}>{mode.icon}</span>
      <span>{mode.name}</span>
    </div>
  );
};

/**
 * Example usage in a parent component:
 * 
 * ```tsx
 * import { ModeBadge } from '@/components/ModeBadge';
 * import { MODES, getModeById } from '@/lib/modes';
 * 
 * function MyComponent() {
 *   const groundedMode = getModeById(3);
 *   
 *   return (
 *     <div>
 *       <h1>Current Mode</h1>
 *       <ModeBadge mode={groundedMode} />
 *       
 *       <h2>All Modes</h2>
 *       {MODES.map(mode => (
 *         <ModeBadge key={mode.id} mode={mode} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * You can also render the mode's quote:
 * 
 * ```tsx
 * function ModeCard({ mode }: { mode: Mode }) {
 *   return (
 *     <div style={{ backgroundColor: mode.color }}>
 *       <ModeBadge mode={mode} />
 *       <p>{mode.description}</p>
 *       <blockquote>{mode.defaultQuote}</blockquote>
 *     </div>
 *   );
 * }
 * ```
 */

export default ModeBadge;
