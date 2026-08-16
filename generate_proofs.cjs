const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  
  // 1. Rootwork & Background tests
  const page = await browser.newPage();
  
  // Desktop
  await page.setViewport({ width: 1200, height: 1080 });
  await page.goto('http://localhost:5173/?bypass=true', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  
  // Go to Rootwork
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent.includes('The Rootwork'));
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'docs/proofs/desktop_background_rootwork.png', fullPage: true });

  // Tablet
  await page.setViewport({ width: 768, height: 1024 });
  await page.screenshot({ path: 'docs/proofs/tablet_background_rootwork.png', fullPage: true });

  // Mobile
  await page.setViewport({ width: 375, height: 812 });
  await page.screenshot({ path: 'docs/proofs/mobile_background_rootwork.png', fullPage: true });

  // 2. The Echo standardization & Rootwork specifics
  // Go back to Desktop
  await page.setViewport({ width: 1200, height: 1080 });
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent.includes('The Echo'));
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'docs/proofs/rootwork_the_echo.png' });

  // 3. Shadow Tome Tests
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent.includes('The Shadow Tome'));
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'docs/proofs/shadowtome_button_disabled.png', fullPage: true });

  // Enable the button by typing
  await page.type('textarea[placeholder*="Etch"]', 'This is a test reflection');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'docs/proofs/shadowtome_button_enabled.png', fullPage: true });

  // 4. Batch Upload (Mocking)
  const fileInput = await page.$('input[type="file"][id="tome-batch"]');
  if (fileInput) {
    fs.writeFileSync('test_upload.jpg', 'mock content');
    await fileInput.uploadFile('test_upload.jpg');
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: 'docs/proofs/shadowtome_batch_upload.png', fullPage: true });
  }

  await browser.close();
    try { await require('./test_teardown.cjs')(); } catch (e) {}
})();

