const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('request', req => console.log('BROWSER REQUEST:', req.url()));

  await page.setViewport({ width: 414, height: 896 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('avatar_config', JSON.stringify({}));
    localStorage.setItem('intake_completed', 'true');
  });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  // Login
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.type('#login-email', 'playwright_tester_99@gmail.com');
  await page.type('#login-password', 'password123');
  await page.click('#login-submit');
  
  await page.waitForSelector('button', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const enterBtn = btns.find(b => b.textContent.includes('Enter the Sanctuary'));
    if (enterBtn) enterBtn.click();
  });
  
  await page.waitForSelector('.tb', { timeout: 10000 });
  
  // Click Grimoire
  console.log("TESTING SCRIPT: Clicking Grimoire tab");
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tb'));
    const tab = tabs.find(el => el.title === 'The Grimoire');
    if (tab) tab.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Click Commune
  console.log("TESTING SCRIPT: Clicking Commune button");
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.trim() === 'Commune');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("TESTING SCRIPT: Did we find and click Commune?", clicked);
  
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'docs/proofs/commune_diagnostic.png' });
  console.log("TESTING SCRIPT: Finished");
  
  await browser.close();
})();
