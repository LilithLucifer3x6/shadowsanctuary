const puppeteer = require('puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms));
const DATA_DIR = 'C:/Users/purpl/shadowsanctuary/docs/screenshots';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  console.log("Loading app...");
  await page.goto('http://localhost:5173');
  await page.waitForSelector('.land', { timeout: 10000 });
  await wait(2000);

  console.log("1. Lavender permanent ban...");
  // Click Lavender
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    const lav = labels.find(l => l.innerText.includes('Lavender'));
    if(lav) lav.click();
  });
  await wait(1000);
  await page.screenshot({ path: `${DATA_DIR}/screenshot_intake.png` });

  await browser.close();
  console.log("Intake screenshot done.");
})();
