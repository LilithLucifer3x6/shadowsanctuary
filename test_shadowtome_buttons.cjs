const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));
  
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

  await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.tabs button'));
      const stTab = tabs.find(t => t.textContent.includes('Tome'));
      if (stTab) stTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log("Clicking Ignite New Alchemy...");
  await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Ignite New Alchemy'));
      if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Checking if Modal opened...");
  const modalVisible = await page.evaluate(() => !!document.querySelector('.modal'));
  console.log("Modal Visible:", modalVisible);

  console.log("Clicking Record Harvest...");
  await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Record Harvest'));
      if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log("Checking Entry Text Box...");
  const entryText = await page.evaluate(() => document.querySelector('#tome-history textarea')?.value || '');
  console.log("Entry Text Box contains:", entryText.substring(0, 50) + "...");

  await browser.close();
})();
