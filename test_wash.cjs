const puppeteer = require('puppeteer-core');
const fs = require('fs').promises;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1080 });

  try {
    console.log("Navigating to app...");
    // test_grim=1 bypasses login and mounts Grimoire directly
    await page.goto('http://localhost:5173/?test_grim=1', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Clicking Log Wash Day...");
    await page.click('text=Log Wash Day');
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Filling the Wash Day form...");
    await page.type('textarea', 'Clarifying shampoo followed by deep conditioning.');
    
    // Upload image
    console.log("Uploading image...");
    const dummyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await fs.writeFile('dummy.png', dummyImage);
    
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('dummy.png');
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("Submitting form...");
    await page.click('text=Commit to Ledger');
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Taking screenshot...");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/11-wash-ledger.png', fullPage: true });
    
  } catch(e) {
    console.error("Test Failed:", e);
    await fs.writeFile('docs/proofs/11-wash-error-dom.html', await page.content());
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/11-wash-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
