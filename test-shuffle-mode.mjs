// test-shuffle-mode.mjs
// Simple integration test for Shuffle Mode functionality

import { readFileSync } from 'fs';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Test 1: Verify "View all activities" text is removed
test('Should not contain "View all activities" text in any files', () => {
  const filesToCheck = [
    'js/mode-activity-view.js',
    'index.html',
    'script.js'
  ];
  
  for (const file of filesToCheck) {
    const content = readFileSync(file, 'utf-8');
    const hasViewAll = content.toLowerCase().includes('view all activities');
    assert(!hasViewAll, `Found "View all activities" text in ${file}`);
  }
});

// Test 2: Verify Shuffle Mode script exists
test('Shuffle Mode script file should exist', () => {
  const shuffleScript = readFileSync('js/shuffle-mode.js', 'utf-8');
  assert(shuffleScript.length > 0, 'Shuffle Mode script is empty');
  assert(shuffleScript.includes('window.ShuffleMode'), 'ShuffleMode not exported');
  assert(shuffleScript.includes('Fisher-Yates'), 'Fisher-Yates shuffle not documented');
});

// Test 3: Verify Shuffle Mode is referenced in index.html
test('index.html should include shuffle-mode.js script', () => {
  const html = readFileSync('index.html', 'utf-8');
  assert(html.includes('js/shuffle-mode.js'), 'shuffle-mode.js not included in HTML');
});

// Test 4: Verify Shuffle Mode block exists in HTML
test('index.html should have Shuffle Mode section', () => {
  const html = readFileSync('index.html', 'utf-8');
  assert(html.includes('shuffle-mode-block'), 'Shuffle Mode block not found in HTML');
  assert(html.includes('Start Shuffle Mode'), 'Start Shuffle Mode button not found');
  assert(html.includes('data-action="shuffle-mode"'), 'Shuffle mode action not found');
});

// Test 5: Verify script.js has shuffle mode handler
test('script.js should handle shuffle-mode action', () => {
  const script = readFileSync('script.js', 'utf-8');
  assert(script.includes("action === 'shuffle-mode'"), 'Shuffle mode action handler not found');
  assert(script.includes('window.ShuffleMode'), 'ShuffleMode reference not found in script.js');
});

// Test 6: Verify CSS has shuffle mode styles
test('style.css should have Shuffle Mode styles', () => {
  const css = readFileSync('style.css', 'utf-8');
  assert(css.includes('.shuffle-mode-block'), 'Shuffle mode block styles not found');
  assert(css.includes('.shuffle-mode-cta'), 'Shuffle mode CTA styles not found');
});

// Test 7: Verify spacing tokens are defined
test('style.css should define spacing tokens', () => {
  const css = readFileSync('style.css', 'utf-8');
  assert(css.includes('--space-xs'), 'Spacing tokens not found');
  assert(css.includes('--space-sm'), 'Spacing tokens not found');
  assert(css.includes('--space-md'), 'Spacing tokens not found');
  assert(css.includes('--space-lg'), 'Spacing tokens not found');
});

// Test 8: Verify prefers-reduced-motion support
test('style.css should have comprehensive prefers-reduced-motion support', () => {
  const css = readFileSync('style.css', 'utf-8');
  assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'prefers-reduced-motion not found');
  assert(css.includes('animation: none'), 'animation: none not found in reduced motion');
});

// Test 9: Verify modal improvements
test('style.css should have improved modal scrolling', () => {
  const css = readFileSync('style.css', 'utf-8');
  assert(css.includes('max-height:calc(100vh') || css.includes('max-height: calc(100vh'), 'Dialog max-height not updated');
  assert(css.includes('-webkit-overflow-scrolling'), 'Momentum scrolling not added');
  assert(css.includes('will-change'), 'Hardware acceleration not added');
});

// Test 10: Verify ESC and focus trap support in script.js
test('script.js should have ESC key and focus trap support', () => {
  const script = readFileSync('script.js', 'utf-8');
  assert(script.includes('Escape'), 'ESC key handler not found');
  assert(script.includes('_escHandler'), 'ESC handler not implemented');
  assert(script.includes('_focusTrapHandler'), 'Focus trap handler not implemented');
  assert(script.includes('Tab'), 'Tab key handling not found');
});

// Run all tests
console.log('Running Shuffle Mode Integration Tests...\n');

for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
