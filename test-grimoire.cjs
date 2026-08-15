const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('[PAGE CONSOLE] ' + msg.type().toUpperCase() + ':', msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('[PAGE ERROR]:', err.message);
  });
  
  page.on('requestfailed', request => {
    console.log('[REQUEST FAILED]:', request.url(), request.failure().errorText);
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  console.log('Page loaded.');
  
  try {
    await page.type('input[type="email"]', 'purpleirishlilli69@gmail.com');
    await page.type('input[type="password"]', 'purpleirishlilli69');
    await page.click('button.btn.plum');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
    console.log('Logged in.');
  } catch(e) {
    console.log('Login error:', e.message);
  }

  await page.goto('http://localhost:5173/grimoire', { waitUntil: 'networkidle2' });
  console.log('At Grimoire.');

  // Click Commune
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Commune'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const input = await page.$('textarea, input[type="text"]');
  if (input) {
    await input.type('I am ready.');
    console.log('Typed input.');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Deliver unto the Keeper'));
      if (btn) btn.click();
    });
    console.log('Waiting 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
  }

  await browser.close();
})();
