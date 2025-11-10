// test-network.mjs - Check what resources are loading
import puppeteer from 'puppeteer';

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const requests = [];
  page.on('request', req => {
    if (req.url().includes('localhost')) {
      requests.push({ url: req.url(), method: req.method() });
    }
  });
  
  const responses = [];
  page.on('response', resp => {
    if (resp.url().includes('localhost')) {
      responses.push({ 
        url: resp.url().split('/').pop(), 
        status: resp.status(),
        contentType: resp.headers()['content-type']
      });
    }
  });
  
  page.on('pageerror', err => console.log('[ERROR]', err.message));
  
  await page.goto('http://localhost:9000', { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log('\n=== RESPONSES ===');
  responses.forEach(r => {
    const statusIcon = r.status === 200 ? '✓' : '✗';
    console.log(`${statusIcon} [${r.status}] ${r.url} (${r.contentType})`);
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  const info = await page.evaluate(() => ({
    rcExists: !!window.__rc,
    modesCount: window.MODES ? window.MODES.length : 0,
    cards: document.querySelectorAll('.mode-card').length
  }));
  
  console.log('\n=== PAGE STATE ===');
  console.log('window.__rc exists:', info.rcExists);
  console.log('Modes loaded:', info.modesCount);
  console.log('Cards rendered:', info.cards);
  
  await browser.close();
  process.exit(0);
}

main();
