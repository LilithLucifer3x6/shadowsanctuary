const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'C:/Users/purpl/shadowsanctuary/docs/screenshots/debug.png' });
  await browser.close();
  console.log("Debug screenshot taken");
})();
