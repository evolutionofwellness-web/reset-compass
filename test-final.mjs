// test-final.mjs
import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', err => console.log('[ERROR]', err.message));
  page.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('modes') || txt.includes('loaded')) {
      console.log(`[${msg.type()}]`, txt);
    }
  });
  
  await page.goto('http://localhost:9001', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const result = await page.evaluate(() => ({
    rcExists: !!window.__rc,
    modes: window.MODES ? window.MODES.length : 0,
    cards: document.querySelectorAll('.mode-card').length
  }));
  
  console.log('\n✓ window.__rc:', result.rcExists);
  console.log('✓ Modes loaded:', result.modes);
  console.log('✓ Cards rendered:', result.cards);
  
  await browser.close();
  process.exit(result.cards > 0 ? 0 : 1);
}

main();
