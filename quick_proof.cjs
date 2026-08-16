const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1080 });
  await page.goto('http://localhost:5173/?bypass=true', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent.includes('The Rootwork'));
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'docs/proofs/p1-rootwork.png', fullPage: true });
  await browser.close();
    try { await require('./test_teardown.cjs')(); } catch (e) {}
})();

