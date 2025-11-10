// test-headless.mjs - Automated headless browser tests for cinematic scaffold
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_PORT = 8080;
const TEST_URL = `http://localhost:${TEST_PORT}`;

let server = null;
let browser = null;

const results = {
  passed: [],
  failed: [],
  errors: []
};

function log(msg) {
  console.log(`[TEST] ${msg}`);
}

function pass(test) {
  results.passed.push(test);
  log(`✓ ${test}`);
}

function fail(test, reason) {
  results.failed.push({ test, reason });
  log(`✗ ${test}: ${reason}`);
}

function error(test, err) {
  results.errors.push({ test, error: err.message });
  log(`ERROR ${test}: ${err.message}`);
}

async function startServer() {
  return new Promise((resolve, reject) => {
    log('Starting HTTP server on port ' + TEST_PORT);
    server = spawn('npx', ['http-server', '.', '-p', TEST_PORT, '-c-1', '--silent'], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Available')) {
        setTimeout(() => resolve(), 1000);
      }
    });
    
    server.stderr.on('data', (data) => {
      console.error('[SERVER]', data.toString());
    });
    
    setTimeout(() => resolve(), 3000); // Fallback timeout
  });
}

async function stopServer() {
  if (server) {
    log('Stopping server');
    server.kill();
  }
}

async function runTests() {
  try {
    await startServer();
    
    log('Launching browser');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Collect console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    });
    
    // Collect errors
    const pageErrors = [];
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });
    
    // Collect network errors
    const networkErrors = [];
    page.on('response', response => {
      const status = response.status();
      const url = response.url();
      if (status >= 400 && !url.includes('adsbygoogle')) {
        networkErrors.push({ url, status });
      }
    });
    
    log(`Navigating to ${TEST_URL}`);
    await page.goto(TEST_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Test 1: Console contains "modes loaded"
    try {
      const hasModesLoaded = consoleMessages.some(m => 
        m.text.includes('modes loaded')
      );
      if (hasModesLoaded) {
        pass('Console contains "modes loaded"');
      } else {
        fail('Console contains "modes loaded"', 'Message not found. Console: ' + 
          consoleMessages.map(m => m.text).join(', '));
      }
    } catch (err) {
      error('Console contains "modes loaded"', err);
    }
    
    // Test 2: Mode grid element exists
    try {
      const modesGrid = await page.$('#modesGrid');
      if (modesGrid) {
        pass('Mode grid element (#modesGrid) exists');
      } else {
        fail('Mode grid element (#modesGrid) exists', 'Element not found');
      }
    } catch (err) {
      error('Mode grid element (#modesGrid) exists', err);
    }
    
    // Test 3: At least one mode card rendered
    try {
      await page.waitForSelector('.mode-card', { timeout: 5000 });
      const modeCards = await page.$$('.mode-card');
      if (modeCards.length > 0) {
        pass(`Mode cards rendered (found ${modeCards.length})`);
      } else {
        fail('Mode cards rendered', 'No mode cards found');
      }
    } catch (err) {
      error('Mode cards rendered', err);
    }
    
    // Test 4: Click activity and verify checkbox toggle
    try {
      // First open a mode dialog
      await page.click('.mode-card');
      await page.waitForSelector('#modeDialog[open]', { timeout: 3000 });
      pass('Mode dialog opens on card click');
      
      // Wait for activities to render
      await page.waitForSelector('.quick-wins-list li', { timeout: 3000 });
      
      // Click first activity row
      const activityRow = await page.$('.quick-wins-list li .activity-row');
      if (activityRow) {
        await activityRow.click();
        
        // Check if activity has selected class
        const listItem = await page.$('.quick-wins-list li');
        const hasSelected = await page.evaluate(el => {
          const checkbox = el.querySelector('input[type="checkbox"]');
          return checkbox && checkbox.checked;
        }, listItem);
        
        if (hasSelected) {
          pass('Activity click toggles checkbox');
        } else {
          fail('Activity click toggles checkbox', 'Checkbox not checked after click');
        }
      } else {
        fail('Activity click toggles checkbox', 'No activity rows found');
      }
    } catch (err) {
      error('Activity click toggles checkbox', err);
    }
    
    // Test 5: Complete selected and verify localStorage
    try {
      const startBtn = await page.$('#startResetBtn:not([disabled])');
      if (startBtn) {
        await startBtn.click();
        
        // Wait a moment for localStorage to be updated
        await new Promise(r => setTimeout(r, 1000));
        
        const historyData = await page.evaluate(() => {
          return localStorage.getItem('resetCompassHistory');
        });
        
        if (historyData) {
          const history = JSON.parse(historyData);
          if (history && history.length > 0) {
            pass('localStorage reset_history contains entry after completion');
          } else {
            fail('localStorage reset_history contains entry', 'History array is empty');
          }
        } else {
          fail('localStorage reset_history contains entry', 'No history data found');
        }
      } else {
        fail('Complete Selected button', 'Button not enabled or not found');
      }
    } catch (err) {
      error('localStorage reset_history contains entry', err);
    }
    
    // Test 6: Intro overlay (simulate first visit)
    try {
      // Clear session storage and reload
      await page.evaluate(() => {
        sessionStorage.removeItem('introPlayed');
      });
      
      await page.reload({ waitUntil: 'networkidle0' });
      
      // Check if intro overlay appeared (if not prefers-reduced-motion)
      const prefersReducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });
      
      if (!prefersReducedMotion) {
        const introOverlay = await page.$('.intro-overlay');
        if (introOverlay) {
          pass('Intro overlay appears on first visit');
          
          // Wait for it to disappear
          await page.waitForSelector('.intro-overlay', { hidden: true, timeout: 5000 });
          pass('Intro overlay fades out after animation');
        } else {
          fail('Intro overlay appears on first visit', 'Overlay not found');
        }
      } else {
        pass('Intro skipped (prefers-reduced-motion detected)');
      }
    } catch (err) {
      error('Intro overlay test', err);
    }
    
    // Test 7: No console errors
    try {
      const uncaughtErrors = pageErrors.filter(e => 
        !e.includes('adsbygoogle') && !e.includes('Extension')
      );
      if (uncaughtErrors.length === 0) {
        pass('No uncaught exceptions in console');
      } else {
        fail('No uncaught exceptions in console', 
          `Found ${uncaughtErrors.length} errors: ${uncaughtErrors.join('; ')}`);
      }
    } catch (err) {
      error('No uncaught exceptions in console', err);
    }
    
    // Test 8: No critical network errors
    try {
      const criticalErrors = networkErrors.filter(e => 
        e.url.includes('/data/') || e.url.includes('/js/') || 
        e.url.includes('/css/') || e.url.includes('/assets/')
      );
      if (criticalErrors.length === 0) {
        pass('No network 4xx/5xx for required files');
      } else {
        fail('No network 4xx/5xx for required files', 
          `Errors: ${criticalErrors.map(e => `${e.url} (${e.status})`).join(', ')}`);
      }
    } catch (err) {
      error('No network 4xx/5xx for required files', err);
    }
    
  } catch (err) {
    log(`FATAL ERROR: ${err.message}`);
    results.errors.push({ test: 'Test execution', error: err.message });
  } finally {
    if (browser) {
      await browser.close();
    }
    await stopServer();
  }
}

async function main() {
  log('Starting headless browser tests');
  log('='.repeat(60));
  
  await runTests();
  
  log('='.repeat(60));
  log('Test Results:');
  log(`  Passed: ${results.passed.length}`);
  log(`  Failed: ${results.failed.length}`);
  log(`  Errors: ${results.errors.length}`);
  
  if (results.failed.length > 0) {
    log('\nFailed Tests:');
    results.failed.forEach(f => {
      log(`  ✗ ${f.test}`);
      log(`    ${f.reason}`);
    });
  }
  
  if (results.errors.length > 0) {
    log('\nErrors:');
    results.errors.forEach(e => {
      log(`  ERROR ${e.test}: ${e.error}`);
    });
  }
  
  // Write results to file
  const resultsJSON = JSON.stringify(results, null, 2);
  const fs = await import('fs');
  fs.writeFileSync('test-results.json', resultsJSON);
  log('\nResults written to test-results.json');
  
  process.exit(results.failed.length + results.errors.length);
}

main();
