const puppeteer = require('puppeteer');
const fs = require('fs');
const crypto = require('crypto');

function hash(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0,16);
}

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--start-maximized'] });
  const page = await browser.newPage();

  // Navigate to app
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:5173/?bypass=true', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 2000));

  // Take a screenshot of the starting screen to see what's there
  await page.screenshot({ path: 'docs/proofs/DEBUG_start.png' });
  console.log('start hash:', hash('docs/proofs/DEBUG_start.png'));

  // Find and list all nav buttons
  const navText = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, [role=tab], a, nav *'))
      .filter(el => el.textContent.trim().length > 0 && el.textContent.trim().length < 60)
      .map(el => ({ tag: el.tagName, text: el.textContent.trim().substring(0, 50), id: el.id, className: el.className.substring(0,40) }));
  });
  console.log('Nav elements:', JSON.stringify(navText.slice(0, 30)));

  await browser.close();
})();
