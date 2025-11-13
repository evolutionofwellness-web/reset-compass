// Manual test script to verify the changes work correctly
// Run with: node manual-test.mjs

import fs from 'fs';

console.log('=== Testing Activity Lists Update ===\n');

// Test 1: Verify data structure
console.log('Test 1: Verify data/activities.json structure');
try {
  const data = JSON.parse(fs.readFileSync('data/activities.json', 'utf8'));
  
  // Check modes
  const modes = ['surviving', 'drifting', 'grounded', 'growing'];
  modes.forEach(mode => {
    const count = data.modes[mode].length;
    console.log(`  ✓ ${mode}: ${count} activities ${count === 30 ? '(PASS)' : '(FAIL - expected 30)'}`);
    
    // Check each activity has required fields
    const hasAllFields = data.modes[mode].every(a => a.id && a.text && a.hasOwnProperty('icon'));
    console.log(`    - All activities have id, text, icon fields: ${hasAllFields ? 'PASS' : 'FAIL'}`);
  });
  
  // Check Quick Wins
  const qwCount = data.quickWins.length;
  console.log(`  ✓ quickWins: ${qwCount} activities ${qwCount === 100 ? '(PASS)' : '(FAIL - expected 100)'}`);
  
  const qwHasAllFields = data.quickWins.every(a => a.id && a.text && a.hasOwnProperty('icon'));
  console.log(`    - All Quick Wins have id, text, icon fields: ${qwHasAllFields ? 'PASS' : 'FAIL'}`);
  
  console.log('\n');
} catch (error) {
  console.error('  ✗ FAIL:', error.message);
}

// Test 2: Verify JavaScript modules exist
console.log('Test 2: Verify JavaScript modules exist');
const jsFiles = [
  'js/mode-activity-view.js',
  'js/quick-wins-view.js'
];

jsFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✓' : '✗'} ${file}: ${exists ? 'PASS' : 'FAIL'}`);
  
  if (exists) {
    const content = fs.readFileSync(file, 'utf8');
    // Check for key functions/objects
    if (file.includes('mode-activity-view')) {
      const hasModeActivityView = content.includes('window.ModeActivityView');
      const hasInit = content.includes('init(options)');
      const hasRender = content.includes('render()');
      console.log(`    - Exports ModeActivityView: ${hasModeActivityView ? 'PASS' : 'FAIL'}`);
      console.log(`    - Has init method: ${hasInit ? 'PASS' : 'FAIL'}`);
      console.log(`    - Has render method: ${hasRender ? 'PASS' : 'FAIL'}`);
    }
    
    if (file.includes('quick-wins-view')) {
      const hasQuickWinsView = content.includes('window.QuickWinsView');
      const hasShuffle = content.includes('shuffle(');
      const hasNext = content.includes('nextQuickWin');
      console.log(`    - Exports QuickWinsView: ${hasQuickWinsView ? 'PASS' : 'FAIL'}`);
      console.log(`    - Has shuffle method: ${hasShuffle ? 'PASS' : 'FAIL'}`);
      console.log(`    - Has nextQuickWin method: ${hasNext ? 'PASS' : 'FAIL'}`);
    }
  }
});

console.log('\n');

// Test 3: Verify documentation
console.log('Test 3: Verify documentation files');
const docFiles = [
  'docs/activity-lists.md',
  'docs/migrations/2025-11-13-update-activities.md'
];

docFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✓' : '✗'} ${file}: ${exists ? 'PASS' : 'FAIL'}`);
  
  if (exists) {
    const content = fs.readFileSync(file, 'utf8');
    const hasContent = content.length > 100;
    console.log(`    - Has content: ${hasContent ? 'PASS' : 'FAIL'}`);
  }
});

console.log('\n');

// Test 4: Verify HTML integration
console.log('Test 4: Verify index.html integration');
try {
  const html = fs.readFileSync('index.html', 'utf8');
  
  const hasModeActivityView = html.includes('mode-activity-view.js');
  const hasQuickWinsView = html.includes('quick-wins-view.js');
  
  console.log(`  ${hasModeActivityView ? '✓' : '✗'} Includes mode-activity-view.js: ${hasModeActivityView ? 'PASS' : 'FAIL'}`);
  console.log(`  ${hasQuickWinsView ? '✓' : '✗'} Includes quick-wins-view.js: ${hasQuickWinsView ? 'PASS' : 'FAIL'}`);
  
  console.log('\n');
} catch (error) {
  console.error('  ✗ FAIL:', error.message);
}

// Test 5: Verify script.js integration
console.log('Test 5: Verify script.js integration');
try {
  const script = fs.readFileSync('script.js', 'utf8');
  
  const hasQuickWinsInit = script.includes('QuickWinsView.init');
  const hasModeActivityInit = script.includes('ModeActivityView.init');
  const hasShowToastExpose = script.includes('window.showToast');
  
  console.log(`  ${hasQuickWinsInit ? '✓' : '✗'} Initializes QuickWinsView: ${hasQuickWinsInit ? 'PASS' : 'FAIL'}`);
  console.log(`  ${hasModeActivityInit ? '✓' : '✗'} Initializes ModeActivityView: ${hasModeActivityInit ? 'PASS' : 'FAIL'}`);
  console.log(`  ${hasShowToastExpose ? '✓' : '✗'} Exposes showToast globally: ${hasShowToastExpose ? 'PASS' : 'FAIL'}`);
  
  console.log('\n');
} catch (error) {
  console.error('  ✗ FAIL:', error.message);
}

// Test 6: Reading level check (sample)
console.log('Test 6: Reading level check (sample activities)');
try {
  const data = JSON.parse(fs.readFileSync('data/activities.json', 'utf8'));
  
  // Sample a few activities and check word count
  const sampleActivities = [
    data.modes.surviving[0],
    data.modes.drifting[5],
    data.modes.grounded[10],
    data.modes.growing[15],
    data.quickWins[25]
  ];
  
  sampleActivities.forEach(activity => {
    const words = activity.text.split(/\s+/).length;
    const simple = words <= 12; // 3rd grade should be short sentences
    console.log(`  ${simple ? '✓' : '⚠'} "${activity.text}" - ${words} words ${simple ? '(PASS)' : '(WARNING - may be complex)'}`);
  });
  
  console.log('\n');
} catch (error) {
  console.error('  ✗ FAIL:', error.message);
}

console.log('=== Test Summary ===');
console.log('Manual tests completed. Review output above for any FAIL results.');
console.log('For full integration testing, load the app in a browser and test:');
console.log('  1. Mode selection → shows single random activity');
console.log('  2. "New One" button cycles through activities');
console.log('  3. "Done" button logs activity');
console.log('  4. "View All" shows full list');
console.log('  5. Quick Wins shuffle and cycle correctly');
console.log('  6. Quick Wins "Done" logs and moves to next');
console.log('  7. History, streaks, and donut chart still work');
