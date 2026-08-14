const puppeteer = require('puppeteer');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  
  // Mobile Viewport
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844 });
  await pageMobile.goto('http://localhost:5173/');

  // Login
  await pageMobile.waitForSelector('input[type="email"]', { timeout: 10000 });
  await pageMobile.type('input[type="email"]', 'test-automation@shadowsanctuary.local');
  await pageMobile.type('input[type="password"]', 'TestPassword123!');
  await pageMobile.evaluate(() => document.querySelector('form button').click());
  await wait(3000);

  // Set mock localstorage to skip intake/avatar
  await pageMobile.evaluate(() => {
      localStorage.setItem('avatar_config', JSON.stringify({ name: 'Automaton', generatedBgs: { grim: '/assets/avatar-tests/part3_916_grimoire.png' } }));
      localStorage.setItem('intake_completed', 'true');
      sessionStorage.setItem('al_currentScreen', 'app');
  });
  await pageMobile.goto('http://localhost:5173/');
  await wait(2000);

  console.log('Capturing Mobile Viewport...');
  await pageMobile.screenshot({ path: 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\0be76408-6bc5-4ff5-a2bb-20a516df3f62\\bg_crop_mobile.png' });
  await pageMobile.close();

  // Desktop Viewport
  const pageDesktop = await browser.newPage();
  await pageDesktop.setViewport({ width: 1440, height: 900 });
  await pageDesktop.goto('http://localhost:5173/');
  await wait(2000);
  console.log('Capturing Desktop Viewport...');
  await pageDesktop.screenshot({ path: 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\0be76408-6bc5-4ff5-a2bb-20a516df3f62\\bg_crop_desktop.png' });
  await pageDesktop.close();

  console.log('Done.');
  await browser.close();
})();
