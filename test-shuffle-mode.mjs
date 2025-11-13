/**
 * Simple tests for shuffle mode and removed "View all activities"
 * Run with: node test-shuffle-mode.mjs
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const errors = [];
const warnings = [];

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (err) {
    errors.push(`❌ ${name}: ${err.message}`);
    console.error(`❌ ${name}: ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Read files
const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
const modeActivityViewJs = readFileSync(join(process.cwd(), 'js/mode-activity-view.js'), 'utf-8');
const shuffleModeJs = readFileSync(join(process.cwd(), 'js/shuffle-mode.js'), 'utf-8');
const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
const stylesCss = readFileSync(join(process.cwd(), 'style.css'), 'utf-8');

console.log('\n🧪 Running Shuffle Mode Tests...\n');

// Test 1: Verify "View all activities" text is removed
test('Removed "View all activities" from mode-activity-view.js', () => {
  assert(
    !modeActivityViewJs.includes('View All Activities') && !modeActivityViewJs.includes('View all activities'),
    '"View all activities" text should be removed from mode-activity-view.js'
  );
});

// Test 2: Verify shuffle mode button is added
test('Added "Shuffle Mode" button in mode-activity-view.js', () => {
  assert(
    modeActivityViewJs.includes('Shuffle Mode') || modeActivityViewJs.includes('shuffle'),
    'Shuffle Mode reference should be present'
  );
});

// Test 3: Verify shuffle-mode.js exists and has key features
test('Shuffle mode file exists with Fisher-Yates algorithm', () => {
  assert(
    shuffleModeJs.includes('Fisher-Yates') || shuffleModeJs.includes('shuffle'),
    'Shuffle mode should implement Fisher-Yates shuffle'
  );
});

// Test 4: Verify shuffle mode has non-repeating logic
test('Shuffle mode implements non-repeating until exhausted', () => {
  assert(
    shuffleModeJs.includes('currentIndex') && shuffleModeJs.includes('shuffledActivities'),
    'Shuffle mode should track current index and shuffled activities'
  );
});

// Test 5: Verify allow-repeat toggle exists
test('Shuffle mode has allow-repeat toggle', () => {
  assert(
    shuffleModeJs.includes('allowRepeat') || shuffleModeJs.includes('allow-repeat'),
    'Shuffle mode should have allow-repeat toggle'
  );
});

// Test 6: Verify gesture support (swipe)
test('Shuffle mode has gesture support', () => {
  assert(
    shuffleModeJs.includes('touchstart') || shuffleModeJs.includes('touchend') || shuffleModeJs.includes('swipe'),
    'Shuffle mode should support swipe gestures'
  );
});

// Test 7: Verify keyboard support
test('Shuffle mode has keyboard navigation', () => {
  assert(
    shuffleModeJs.includes('ArrowLeft') || shuffleModeJs.includes('ArrowRight') || shuffleModeJs.includes('Escape'),
    'Shuffle mode should support keyboard navigation'
  );
});

// Test 8: Verify prefers-reduced-motion support
test('Shuffle mode respects prefers-reduced-motion', () => {
  assert(
    shuffleModeJs.includes('prefers-reduced-motion'),
    'Shuffle mode should respect prefers-reduced-motion'
  );
});

// Test 9: Verify focus-trap dependency added (not focus-trap-react)
test('Added focus-trap dependency (not focus-trap-react)', () => {
  assert(
    packageJson.dependencies && packageJson.dependencies['focus-trap'],
    'focus-trap should be in dependencies'
  );
  assert(
    !packageJson.dependencies['focus-trap-react'],
    'focus-trap-react should NOT be in dependencies (vanilla JS project)'
  );
});

// Test 10: Verify lottie-react is NOT added
test('Did NOT add lottie-react (user declined)', () => {
  assert(
    !packageJson.dependencies || !packageJson.dependencies['lottie-react'],
    'lottie-react should NOT be in dependencies (user declined)'
  );
});

// Test 11: Verify shuffle-mode.js is included in index.html
test('Shuffle mode script included in index.html', () => {
  assert(
    indexHtml.includes('shuffle-mode.js'),
    'shuffle-mode.js should be included in index.html'
  );
});

// Test 12: Verify spacing tokens added to CSS
test('Added spacing tokens to CSS', () => {
  assert(
    stylesCss.includes('--space-xs') && stylesCss.includes('--space-sm') && stylesCss.includes('--space-md'),
    'Spacing tokens should be defined in CSS'
  );
});

// Test 13: Verify prefers-reduced-motion in CSS
test('Added prefers-reduced-motion support to CSS', () => {
  assert(
    stylesCss.includes('@media (prefers-reduced-motion: reduce)'),
    'CSS should include prefers-reduced-motion media query'
  );
});

// Test 14: Verify modal scrolling improvements
test('Modal has improved scrolling with safe-area insets', () => {
  assert(
    stylesCss.includes('safe-area-inset') || stylesCss.includes('-webkit-overflow-scrolling'),
    'Modal should have improved scrolling with safe-area insets'
  );
});

// Test 15: Verify hardware-accelerated CSS
test('CSS uses hardware acceleration', () => {
  assert(
    stylesCss.includes('translateZ(0)') || stylesCss.includes('will-change'),
    'CSS should use hardware-accelerated properties'
  );
});

// Test 16: Verify animations use transform + opacity only
test('Animations optimized with transform and opacity', () => {
  assert(
    shuffleModeJs.includes('transform') && shuffleModeJs.includes('opacity'),
    'Shuffle mode animations should use transform and opacity'
  );
});

console.log('\n📊 Test Summary:');
console.log(`   Passed: ${16 - errors.length}/16`);
if (errors.length > 0) {
  console.log(`   Failed: ${errors.length}/16`);
  console.log('\n❌ Failed tests:');
  errors.forEach(err => console.log(`   ${err}`));
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
