const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812 });

  page.on('dialog', async dialog => {
    console.log('Dialog:', dialog.message());
    await dialog.accept();
  });

  console.log('Logging in...');
  await page.goto('http://localhost:5173/');
  
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.type('#login-email', 'playwright_tester_99@gmail.com');
  await page.type('#login-password', 'password123');
  await page.click('#login-submit');
  
  await page.waitForSelector('button', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(btn=>btn.textContent.includes('Awaken'));
    if(b) b.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // 1. Rootwork Echo Batch
  console.log('Navigating to Rootwork...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Rootwork');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  console.log('Uploading batch to Echo...');
  const echoInput = await page.$('input[type="file"]');
  if (echoInput) {
    await echoInput.uploadFile(path.resolve('test1.jpg'), path.resolve('test2.jpg'));
    console.log('Waiting for Echo batch processing...');
    await page.waitForFunction(() => {
      const el = document.body.innerText;
      return el.includes('Divining resonance') || el.includes('clouded') || el.includes('**');
    }, {timeout: 45000}).catch(()=>console.log('Echo timeout'));
  }
  await new Promise(r => setTimeout(r, 3000));
  await page.evaluateHandle('document.fonts.ready');
  await page.screenshot({ path: 'docs/proofs/2-echo-batch.png', fullPage: true });

  // 2. Shadow Tome Batch + Form
  console.log('Navigating to Shadow Tome...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Shadow Tome');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Uploading batch to Shadow Tome...');
  const teaInput = await page.$('input[type="file"]');
  if (teaInput) {
    await teaInput.uploadFile(path.resolve('test1.jpg'), path.resolve('test2.jpg'));
    console.log('Waiting for Tea batch processing...');
    await new Promise(r => setTimeout(r, 15000)); // wait for 2 teas to process
  }
  
  // Fill form to show enabled state
  console.log('Filling out form...');
  const textareas = await page.$$('textarea');
  if (textareas.length > 0) {
    await textareas[textareas.length-1].type('My meditation notes from the twilight hours...');
  }
  
  await page.evaluate(() => {
    const pills = document.querySelectorAll('.mood-pill');
    if (pills.length > 0) pills[0].click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluateHandle('document.fonts.ready');
  await page.screenshot({ path: 'docs/proofs/2-shadow-tome-batch-and-enabled.png', fullPage: true });

  await browser.close();
  console.log('Done!');
})();
