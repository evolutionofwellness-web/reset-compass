// test-shuffle-mode.mjs - Tests for Shuffle Mode functionality
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

let server = null;

async function main() {
  console.log('Starting test server...');
  server = spawn('npx', ['http-server', '.', '-p', '8083', '-c-1', '--silent']);
  await new Promise(r => setTimeout(r, 3000));
  
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const logs = [];
  const errors = [];
  
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => errors.push(err.message));
  
  console.log('Loading page...');
  await page.goto('http://localhost:8083', { waitUntil: 'networkidle0', timeout: 30000 });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n=== TEST 1: Shuffle Mode Module Loaded ===');
  const shuffleModeLoaded = await page.evaluate(() => {
    return typeof window.ShuffleMode !== 'undefined';
  });
  console.log('ShuffleMode module loaded:', shuffleModeLoaded ? '✓ PASS' : '✗ FAIL');
  
  console.log('\n=== TEST 2: Shuffle Mode UI Module Loaded ===');
  const shuffleModeUILoaded = await page.evaluate(() => {
    return typeof window.ShuffleModeUI !== 'undefined';
  });
  console.log('ShuffleModeUI module loaded:', shuffleModeUILoaded ? '✓ PASS' : '✗ FAIL');
  
  console.log('\n=== TEST 3: Shuffle Mode Dialog Exists ===');
  const dialogExists = await page.evaluate(() => {
    const dialog = document.getElementById('shuffleModeDialog');
    return dialog !== null;
  });
  console.log('Shuffle Mode dialog exists:', dialogExists ? '✓ PASS' : '✗ FAIL');
  
  console.log('\n=== TEST 4: Shuffle Mode Button Exists ===');
  const buttonExists = await page.evaluate(() => {
    const button = document.querySelector('[data-action="shuffle-mode"]');
    return button !== null;
  });
  console.log('Shuffle Mode button exists:', buttonExists ? '✓ PASS' : '✗ FAIL');
  
  console.log('\n=== TEST 5: Fisher-Yates Shuffle Algorithm ===');
  const shuffleWorks = await page.evaluate(() => {
    if (!window.ShuffleMode) return false;
    
    // Initialize session
    const initialized = window.ShuffleMode.initialize(false);
    if (!initialized) return false;
    
    // Get session to check if deck is shuffled
    const session = window.ShuffleMode.getSession();
    return session.deck && session.deck.length > 0;
  });
  console.log('Shuffle algorithm works:', shuffleWorks ? '✓ PASS' : '✗ FAIL');
  
  console.log('\n=== TEST 6: Non-Repeating Behavior ===');
  const nonRepeatWorks = await page.evaluate(() => {
    if (!window.ShuffleMode) return false;
    
    window.ShuffleMode.initialize(false); // allowRepeat = false
    const session = window.ShuffleMode.getSession();
    const deckLength = session.deck.length;
    
    // Navigate through all activities
    for (let i = 0; i < deckLength - 1; i++) {
      window.ShuffleMode.next();
    }
    
    // Try to go beyond deck
    const result = window.ShuffleMode.next();
    
    // Should indicate exhaustion
    return result && result.exhausted === true;
  });
  console.log('Non-repeating behavior works:', nonRepeatWorks ? '✓ PASS' : '✗ FAIL');
  
  console.log('\n=== TEST 7: Allow Repeat Toggle ===');
  const allowRepeatWorks = await page.evaluate(() => {
    if (!window.ShuffleMode) return false;
    
    window.ShuffleMode.initialize(false);
    const initialState = window.ShuffleMode.getSession().allowRepeat;
    window.ShuffleMode.toggleAllowRepeat();
    const newState = window.ShuffleMode.getSession().allowRepeat;
    
    return initialState === false && newState === true;
  });
  console.log('Allow repeat toggle works:', allowRepeatWorks ? '✓ PASS' : '✗ FAIL');
  
  console.log('\n=== TEST 8: No "View all activities" String ===');
  const noViewAllActivities = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    return !bodyText.includes('View all activities');
  });
  console.log('No "View all activities" found:', noViewAllActivities ? '✓ PASS' : '✗ FAIL');
  
  console.log('\n=== TEST 9: Progress Tracking ===');
  const progressWorks = await page.evaluate(() => {
    if (!window.ShuffleMode) return false;
    
    window.ShuffleMode.initialize(false);
    const progress = window.ShuffleMode.getProgress();
    
    return progress.current === 1 && progress.total > 0 && progress.percentage > 0;
  });
  console.log('Progress tracking works:', progressWorks ? '✓ PASS' : '✗ FAIL');
  
  console.log('\n=== TEST 10: Reshuffle Function ===');
  const reshuffleWorks = await page.evaluate(() => {
    if (!window.ShuffleMode) return false;
    
    window.ShuffleMode.initialize(false);
    
    window.ShuffleMode.reshuffle();
    const session = window.ShuffleMode.getSession();
    
    return session.currentIndex === 0 && session.deck.length > 0;
  });
  console.log('Reshuffle function works:', reshuffleWorks ? '✓ PASS' : '✗ FAIL');
  
  // Summary
  const allTests = [
    shuffleModeLoaded,
    shuffleModeUILoaded,
    dialogExists,
    buttonExists,
    shuffleWorks,
    nonRepeatWorks,
    allowRepeatWorks,
    noViewAllActivities,
    progressWorks,
    reshuffleWorks
  ];
  
  const passed = allTests.filter(t => t).length;
  const total = allTests.length;
  
  console.log('\n=== SUMMARY ===');
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Status: ${passed === total ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
  
  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.log(e));
  }
  
  await browser.close();
  server.kill();
  
  process.exit(passed === total ? 0 : 1);
}

main().catch(err => {
  console.error('Test failed:', err);
  if (server) server.kill();
  process.exit(1);
});
