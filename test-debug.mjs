// test-debug.mjs - Quick debug test to check what's happening
import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const TEST_PORT = 8081;
const TEST_URL = `http://localhost:${TEST_PORT}`;
let server = null;

async function startServer() {
  return new Promise((resolve) => {
    server = spawn('npx', ['http-server', '.', '-p', TEST_PORT, '-c-1', '--silent']);
    setTimeout(() => resolve(), 3000);
  });
}

async function main() {
  await startServer();
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
  
  await page.goto(TEST_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  
  await new Promise(r => setTimeout(r, 3000));
  
  const html = await page.evaluate(() => {
    return {
      modesGridHTML: document.getElementById('modesGrid')?.innerHTML || 'NOT FOUND',
      windowMODES: window.MODES ? window.MODES.length : 'undefined',
      renderModesExists: typeof window.renderModes
    };
  });
  
  console.log('Console logs:', logs);
  console.log('Window MODES:', html.windowMODES);
  console.log('renderModes type:', html.renderModesExists);
  console.log('Modes grid HTML:', html.modesGridHTML.substring(0, 200));
  
  await browser.close();
  server.kill();
  process.exit(0);
}

main();
