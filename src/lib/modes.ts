/**
 * Modes Module
 * 
 * This module provides the canonical Mode type and dataset for the Reset Compass app.
 * The CSV file at data/Reset Compass App Data - Modes.csv is the source of truth.
 * 
 * Usage:
 * ```typescript
 * import { MODES, getModeById, getDefaultMode, type Mode } from '@/lib/modes';
 * 
 * // Get all modes
 * const allModes = MODES;
 * 
 * // Get a specific mode by ID
 * const groundedMode = getModeById(3);
 * 
 * // Get the default mode (Grounded)
 * const defaultMode = getDefaultMode();
 * 
 * // Render mode data
 * console.log(defaultMode.icon, defaultMode.name, defaultMode.color);
 * ```
 */

import modesData from '../../data/modes.json';

/**
 * Mode represents one of the four wellness modes in the Reset Compass app.
 */
export type Mode = {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  defaultQuote: string;
};

/**
 * MODES is the canonical array of all modes in the Reset Compass app.
 * 
 * The four modes are:
 * 1. Surviving - When you're running on empty
 * 2. Drifting - You're okay but unfocused
 * 3. Grounded - You're stable and want steady progress
 * 4. Growing - You're ready to expand capacity
 */
export const MODES: Mode[] = modesData as Mode[];

/**
 * Get a mode by its ID.
 * 
 * @param id - The mode ID (1-4)
 * @returns The mode object, or undefined if not found
 * 
 * @example
 * ```typescript
 * const groundedMode = getModeById(3);
 * if (groundedMode) {
 *   console.log(groundedMode.name); // "Grounded"
 * }
 * ```
 */
export function getModeById(id: number): Mode | undefined {
  return MODES.find(mode => mode.id === id);
}

/**
 * Get the default mode (Grounded, ID 3).
 * 
 * Grounded is the default mode as it represents a stable, sustainable state.
 * 
 * @returns The Grounded mode object
 * 
 * @example
 * ```typescript
 * const defaultMode = getDefaultMode();
 * console.log(defaultMode.name); // "Grounded"
 * ```
 */
export function getDefaultMode(): Mode {
  const defaultMode = getModeById(3);
  if (!defaultMode) {
    throw new Error('Default mode (Grounded, ID 3) not found in MODES array');
  }
  return defaultMode;
}

/**
 * Alternative inline definition (commented out - using JSON import instead):
 * 
 * export const MODES: Mode[] = [
 *   {
 *     id: 1,
 *     name: "Surviving",
 *     description: "When you're running on empty. Use the simplest resets that bring you back to life.",
 *     color: "#A94747",
 *     icon: "🩺",
 *     defaultQuote: "Do the least that helps the most."
 *   },
 *   {
 *     id: 2,
 *     name: "Drifting",
 *     description: "You're okay but unfocused. Gently reconnect with what matters.",
 *     color: "#E6B450",
 *     icon: "🧭",
 *     defaultQuote: "Small steps steer the ship."
 *   },
 *   {
 *     id: 3,
 *     name: "Grounded",
 *     description: "You're stable and want steady progress without burnout.",
 *     color: "#3B755F",
 *     icon: "🌿",
 *     defaultQuote: "Consistency beats intensity."
 *   },
 *   {
 *     id: 4,
 *     name: "Growing",
 *     description: "You're ready to expand capacity intentionally and celebrate progress.",
 *     color: "#4C7EDC",
 *     icon: "🚀",
 *     defaultQuote: "Build from a full tank."
 *   }
 * ];
 */
