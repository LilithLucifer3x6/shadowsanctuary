const puppeteer = require('puppeteer');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/');

  // Login
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.type('input[type="email"]', 'test-automation@shadowsanctuary.local');
  await page.type('input[type="password"]', 'TestPassword123!');
  await page.evaluate(() => document.querySelector('form button').click());
  await wait(3000);

  // Bypass
  await page.evaluate(() => {
      localStorage.setItem('avatar_config', JSON.stringify({ name: 'Automaton' }));
      localStorage.setItem('intake_completed', 'true');
      sessionStorage.setItem('al_currentScreen', 'app');
  });
  await page.goto('http://localhost:5173/');
  await wait(2000);

  // Grimoire Screenshot
  console.log('Navigating to The Grimoire...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tb'));
    const t = tabs.find(t => t.textContent.includes('The Grimoire'));
    if (t) t.click();
  });
  await wait(2000);
  await page.screenshot({ path: 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\0be76408-6bc5-4ff5-a2bb-20a516df3f62\\grimoire_centered.png' });

  // Altars Screenshot
  console.log('Navigating to The Altars...');
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tb'));
    const t = tabs.find(t => t.textContent.includes('The Altars'));
    if (t) t.click();
  });
  await wait(2000);
  await page.screenshot({ path: 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\0be76408-6bc5-4ff5-a2bb-20a516df3f62\\altars_centered.png' });

  console.log('Screenshots saved.');
  await browser.close();
})();
