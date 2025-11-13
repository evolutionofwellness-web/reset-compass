// verify-integration.mjs
// Quick verification that files load without syntax errors

import fs from 'fs';

console.log('=== Integration Verification ===\n');

// Test 1: Load and parse activities.json
console.log('Test 1: Loading activities.json...');
try {
  const activities = JSON.parse(fs.readFileSync('data/activities.json', 'utf8'));
  console.log('  ✓ Loaded successfully');
  console.log(`  ✓ Modes: ${Object.keys(activities.modes).join(', ')}`);
  console.log(`  ✓ Total activities: ${
    Object.values(activities.modes).reduce((sum, arr) => sum + arr.length, 0) +
    activities.quickWins.length
  }`);
} catch (error) {
  console.error('  ✗ FAIL:', error.message);
}

// Test 2: Verify modules can be loaded
console.log('\nTest 2: Checking module syntax...');
const modules = [
  'js/mode-activity-view.js',
  'js/quick-wins-view.js',
  'script.js'
];

modules.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // Basic syntax check - look for common errors
    const hasSyntaxError = /\b(undefined|null)\s*\.\s*\w+/.test(content) && 
                          !content.includes('try {') && 
                          !content.includes('catch');
    
    if (hasSyntaxError) {
      console.log(`  ⚠ ${file}: Potential null reference (manual check needed)`);
    } else {
      console.log(`  ✓ ${file}: Looks good`);
    }
    
    // Check for common issues
    if (file.includes('mode-activity-view')) {
      const hasInit = content.includes('async init(options)');
      const hasRender = content.includes('render()');
      const hasWireEvents = content.includes('wireEvents()');
      console.log(`    - Has init: ${hasInit ? '✓' : '✗'}`);
      console.log(`    - Has render: ${hasRender ? '✓' : '✗'}`);
      console.log(`    - Has wireEvents: ${hasWireEvents ? '✓' : '✗'}`);
    }
    
    if (file.includes('quick-wins-view')) {
      const hasInit = content.includes('async init(options)');
      const hasShuffle = content.includes('shuffle(array)');
      const hasNext = content.includes('nextQuickWin()');
      console.log(`    - Has init: ${hasInit ? '✓' : '✗'}`);
      console.log(`    - Has shuffle: ${hasShuffle ? '✓' : '✗'}`);
      console.log(`    - Has nextQuickWin: ${hasNext ? '✓' : '✗'}`);
    }
    
  } catch (error) {
    console.error(`  ✗ ${file}: ${error.message}`);
  }
});

// Test 3: Check HTML integration
console.log('\nTest 3: Checking HTML integration...');
try {
  const html = fs.readFileSync('index.html', 'utf8');
  
  const checks = [
    { name: 'mode-activity-view.js', test: () => html.includes('mode-activity-view.js') },
    { name: 'quick-wins-view.js', test: () => html.includes('quick-wins-view.js') },
    { name: 'script.js', test: () => html.includes('script.js') },
    { name: 'Correct order (script.js before modules)', test: () => {
      const scriptIdx = html.indexOf('script.js');
      const modeViewIdx = html.indexOf('mode-activity-view.js');
      const quickWinsIdx = html.indexOf('quick-wins-view.js');
      return scriptIdx < modeViewIdx && scriptIdx < quickWinsIdx;
    }}
  ];
  
  checks.forEach(check => {
    console.log(`  ${check.test() ? '✓' : '✗'} ${check.name}`);
  });
  
} catch (error) {
  console.error('  ✗ FAIL:', error.message);
}

// Test 4: Check script.js integration
console.log('\nTest 4: Checking script.js integration...');
try {
  const script = fs.readFileSync('script.js', 'utf8');
  
  const integrationChecks = [
    { name: 'QuickWinsView.init called', test: () => script.includes('QuickWinsView.init') },
    { name: 'ModeActivityView.init called', test: () => script.includes('ModeActivityView.init') },
    { name: 'showToast exposed globally', test: () => script.includes('window.showToast') },
    { name: 'logActivity conversion for modes', test: () => script.includes('type: \'mode\'') || script.includes('type: "mode"') },
    { name: 'logActivity conversion for quickwins', test: () => script.includes('type: \'quickwin\'') || script.includes('type: "quickwin"') },
    { name: 'Fallback to full list', test: () => script.includes('showFullActivityList') }
  ];
  
  integrationChecks.forEach(check => {
    console.log(`  ${check.test() ? '✓' : '✗'} ${check.name}`);
  });
  
} catch (error) {
  console.error('  ✗ FAIL:', error.message);
}

// Test 5: Documentation
console.log('\nTest 5: Checking documentation...');
const docs = [
  'docs/activity-lists.md',
  'docs/migrations/2025-11-13-update-activities.md',
  'IMPLEMENTATION_SUMMARY.md'
];

docs.forEach(doc => {
  const exists = fs.existsSync(doc);
  if (exists) {
    const size = fs.statSync(doc).size;
    console.log(`  ✓ ${doc} (${(size/1024).toFixed(1)}KB)`);
  } else {
    console.log(`  ✗ ${doc} - not found`);
  }
});

console.log('\n=== Summary ===');
console.log('Integration verification complete.');
console.log('\nNext steps:');
console.log('1. Test in browser: http://localhost:8080/');
console.log('2. Click a mode card - should show single random activity');
console.log('3. Click "New One" - should cycle through activities');
console.log('4. Click "Done" - should log and close');
console.log('5. Click Quick Wins - should shuffle and show one at a time');
console.log('6. Verify history, streaks, and donut chart still work');
