const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 896 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('avatar_config', JSON.stringify({}));
    localStorage.setItem('intake_completed', 'true');
  });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.type('#login-email', 'playwright_tester_99@gmail.com');
  await page.type('#login-password', 'password123');
  await page.click('#login-submit');
  
  await page.waitForSelector('button', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Awaken'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  await page.waitForSelector('#trigger-crash');
  await page.click('#trigger-crash');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'docs/proofs/wave1-error-boundary.png', fullPage: true });
  console.log('Captured Error Boundary');
  await browser.close();
})();
