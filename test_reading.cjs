const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new"
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1080 });

  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173/?test_grim=1', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Clicking Commune...");
    await page.click('text=Commune');
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Taking screenshot...");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/11-thirty-day-reading.png', fullPage: true });
    
  } catch(e) {
    console.error("Test Failed:", e);
  } finally {
    await browser.close();
  }
})();
