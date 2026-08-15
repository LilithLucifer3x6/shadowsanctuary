const puppeteer = require('puppeteer');
const fs = require('fs');
if (!fs.existsSync('docs/proofs')) fs.mkdirSync('docs/proofs', { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 896 });

  page.on('dialog', async d => { console.log('Dialog:', d.message()); await d.accept(); });

  // 1. Screenshot the login screen showing forgot-password link
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.click('#trigger-crash');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'docs/proofs/wave1-error-boundary.png', fullPage: true });
  console.log('Captured Error Boundary');

  await browser.close();
  console.log('Done!');
})();
