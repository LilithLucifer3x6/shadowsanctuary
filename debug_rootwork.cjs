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
  
  console.log('Navigating to The Rootwork...');
  try {
    await page.waitForSelector('.tab', { timeout: 10000 });
  } catch (e) {
    await page.screenshot({ path: 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\0be76408-6bc5-4ff5-a2bb-20a516df3f62\\debug_stuck.png' });
    throw e;
  }
  
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const t = tabs.find(t => t.textContent.includes('The Rootwork'));
    if (t) t.click();
  });
  await wait(2000);
  
  console.log('Clicking Add Relic (+)...');
  await page.evaluate(() => {
    const btn = document.querySelector('button .ph-plus');
    if (btn) btn.parentElement.click();
  });
  
  await wait(2000);
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('rootwork_modal_debug.html', html);
  console.log('Saved debug HTML');
  
  await browser.close();
})();
