// test-simple.mjs - Minimal test
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

let server = null;

async function main() {
  server = spawn('npx', ['http-server', '.', '-p', '8082', '-c-1', '--silent']);
  await new Promise(r => setTimeout(r, 3000));
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const logs = [];
  const errors = [];
  
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => errors.push(err.message));
  page.on('response', r => {
    if (r.status() >= 400) {
      console.log(`[${r.status()}] ${r.url()}`);
    }
  });
  
  await page.goto('http://localhost:8082', { waitUntil: 'networkidle0', timeout: 30000 });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const data = await page.evaluate(() => {
    return {
      modesCount: window.MODES ? window.MODES.length : 0,
      modesGridExists: !!document.getElementById('modesGrid'),
      modesGridHTML: document.getElementById('modesGrid')?.innerHTML.substring(0, 300) || 'EMPTY',
      modeCards: document.querySelectorAll('.mode-card').length
    };
  });
  
  console.log('\n=== PAGE DATA ===');
  console.log('Modes loaded:', data.modesCount);
  console.log('Modes grid exists:', data.modesGridExists);
  console.log('Mode cards:', data.modeCards);
  console.log('Grid HTML:', data.modesGridHTML);
  
  console.log('\n=== CONSOLE LOGS ===');
  logs.forEach(l => console.log(l));
  
  console.log('\n=== ERRORS ===');
  errors.forEach(e => console.log(e));
  
  await browser.close();
  server.kill();
  process.exit(0);
}

main();
