const puppeteer = require('puppeteer');
const fs = require('fs');
const crypto = require('crypto');

function hash(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0,16);
}

(async () => {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // User has an active session - go to the real app, not bypass
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 3000));

  // Take first screenshot
  await page.screenshot({ path: 'docs/proofs/DEBUG_realapp.png' });
  console.log('realapp hash:', hash('docs/proofs/DEBUG_realapp.png'));

  // What screen is shown?
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Body text:', bodyText);

  // Get the active tab links
  const tabs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('nav button, .tab-bar button, [data-tab], .nav-item'))
      .map(el => ({ text: el.textContent.trim().substring(0, 40), tag: el.tagName }));
  });
  console.log('Tabs:', JSON.stringify(tabs));

  await browser.close();
})();
