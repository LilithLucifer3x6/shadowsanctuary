const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1080 });
  await page.goto('http://localhost:5173/?bypass=true', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  
  // 3. Shadow Tome Tests
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent.includes('The Shadow Tome'));
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Enable the button by typing
  await page.evaluate(() => {
    const ta = document.querySelector('textarea');
    if(ta) {
      ta.value = 'This is a test reflection';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
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

