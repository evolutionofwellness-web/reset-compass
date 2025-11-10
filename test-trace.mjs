// test-trace.mjs - Trace the error
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

let server = null;

async function main() {
  server = spawn('npx', ['http-server', '.', '-p', '8083', '-c-1', '--silent']);
  await new Promise(r => setTimeout(r, 3000));
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('\n=== PAGE ERROR ===');
    console.log(err.toString());
    console.log(err.stack);
  });
  
  page.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('modes loaded') || txt.includes('onModesLoaded') || txt.includes('renderModes')) {
      console.log(`[${msg.type()}] ${txt}`);
    }
  });
  
  await page.goto('http://localhost:8083', { waitUntil: 'networkidle0', timeout: 30000 });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const debug = await page.evaluate(() => {
    const grid = document.getElementById('modesGrid');
    return {
      gridHTML: grid ? grid.innerHTML : 'NULL',
      gridOuterHTML: grid ? grid.outerHTML.substring(0, 300) : 'NULL',
      modesArray: window.MODES ? window.MODES.map(m => m.id) : [],
      scriptLoaded: !!window.__rc
    };
  });
  
  console.log('\n=== DEBUG INFO ===');
  console.log('Script loaded:', debug.scriptLoaded);
  console.log('Modes:', debug.modesArray);
  console.log('Grid HTML:', debug.gridHTML);
  console.log('Grid outer HTML:', debug.gridOuterHTML);
  
  await browser.close();
  server.kill();
  process.exit(0);
}

main();
