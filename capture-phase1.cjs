const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });

  console.log('Logging in...');
  await page.goto('http://localhost:5173/');
  await page.type('input[type="email"]', 'playwright_tester_99@gmail.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button.btn.plum');
  await page.waitForSelector('.topbar', {timeout: 5000}).catch(()=>console.log('no topbar'));
  
  // 1. Landing Page update
  console.log('Capturing Landing Page...');
  await page.evaluateHandle('document.fonts.ready');
  await page.screenshot({ path: 'docs/proofs/p1-landing.png' });

  // 2. Rootwork - Echo and Silver Toll clipping fix
  console.log('Capturing Rootwork...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Rootwork');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluateHandle('document.fonts.ready');
  await page.screenshot({ path: 'docs/proofs/p1-rootwork.png', fullPage: true });

  // 3. Shadow Tome
  console.log('Capturing Shadow Tome...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Shadow Tome');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluateHandle('document.fonts.ready');
  await page.screenshot({ path: 'docs/proofs/p1-shadowtome.png', fullPage: true });

  await browser.close();
  console.log('Done!');
})();
