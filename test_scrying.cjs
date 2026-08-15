const puppeteer = require('puppeteer-core');
const fs = require('fs').promises;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1080 });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  try {
    // We assume the user has items in their inventory.
    // We will navigate to Scrying tab. 
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173/?test_scrying=1', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Filling the Ledger form...");
    // The Offending Elixir select - just pick the 2nd option
    await page.waitForSelector('select');
    const optionValue = await page.evaluate(() => document.querySelector('select').options[1].value);
    await page.select('select', optionValue);
    
    // Select a reaction
    await page.click('text=Redness');
    
    // Select severity
    await page.click('text=3');
    
    // Upload image
    console.log("Uploading image...");
    // Let's create a dummy small red square image
    const dummyImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await fs.writeFile('dummy.png', dummyImage);
    
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile('dummy.png');
    await new Promise(r => setTimeout(r, 1000)); // wait for file read
    
    console.log("Submitting form...");
    await page.click('text=Give it to the water');
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Taking screenshot...");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/11-reaction-likeness.png', fullPage: true });
    
  } catch(e) {
    console.error("Test Failed:", e);
    await fs.writeFile('docs/proofs/11-dom.html', await page.content());
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/11-reaction-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
