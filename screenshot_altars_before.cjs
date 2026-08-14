const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/');

  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.type('input[type="email"]', 'test-automation@shadowsanctuary.local');
  await page.type('input[type="password"]', 'TestPassword123!');
  await page.evaluate(() => document.querySelector('form button').click());
  
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
      localStorage.setItem('intake_completed', 'true');
      sessionStorage.setItem('al_currentScreen', 'app');
  });
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));

  console.log('Capturing Altars before fix...');
  await page.screenshot({ path: 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\0be76408-6bc5-4ff5-a2bb-20a516df3f62\\altars_before.png' });
  await page.close();
  await browser.close();
  console.log('Done.');
})();
