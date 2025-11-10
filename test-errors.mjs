// test-errors.mjs - Better error tracking
import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Track all script evaluations
  await page.evaluateOnNewDocument(() => {
    const originalError = window.Error;
    window.Error = function(...args) {
      console.log('[NEW ERROR]', ...args);
      return new originalError(...args);
    };
  });
  
  page.on('pageerror', err => {
    console.log('\n=== PAGE ERROR ===');
    console.log('Message:', err.message);
    console.log('Stack:', err.stack);
  });
  
  page.on('console', msg => {
    const txt = msg.text();
    if (!txt.includes('deprecated') && !txt.includes('DeprecationWarning')) {
      console.log(`[${msg.type()}] ${txt}`);
    }
  });
  
  await page.goto('http://localhost:9000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const state = await page.evaluate(() => {
    try {
      return {
        rcExists: !!window.__rc,
        modesCount: window.MODES ? window.MODES.length : 0,
        gridExists: !!document.getElementById('modesGrid'),
        gridContent: document.getElementById('modesGrid')?.innerHTML || '',
        cards: document.querySelectorAll('.mode-card').length,
        error: null
      };
    } catch (e) {
      return { error: e.toString() };
    }
  });
  
  console.log('\n=== STATE ===');
  console.log(JSON.stringify(state, null, 2));
  
  await browser.close();
  process.exit(0);
}

main();
