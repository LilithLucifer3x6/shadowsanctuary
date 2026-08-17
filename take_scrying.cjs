const puppeteer = require('puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms));

const DATA_DIR = 'C:/Users/purpl/.gemini/antigravity/brain/4d981e94-ffe7-43c4-9935-b754859ef1c0';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#app', { timeout: 10000 });
  await wait(2000);
  
  // bypass lock
  try {
    const isLock = await page.evaluate(() => document.body.innerText.includes('Sanctuary Gate'));
    if (isLock) {
      await page.evaluate(() => document.querySelectorAll('button')[9].click()); // '0'
      await page.evaluate(() => document.querySelectorAll('button')[9].click());
      await page.evaluate(() => document.querySelectorAll('button')[9].click());
      await page.evaluate(() => document.querySelectorAll('button')[9].click());
      await wait(1000);
    }
  } catch (e) {}

  // Scrying Pool
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const scryTab = tabs.find(t => t.innerText.includes('Scrying Pool'));
    if(scryTab) scryTab.click();
  });
  await wait(1500);
  await page.screenshot({ path: `${DATA_DIR}/test_scrying_pool.png` });

  await browser.close();
})();
