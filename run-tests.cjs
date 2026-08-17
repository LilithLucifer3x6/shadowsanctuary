const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('Starting puppeteer...');
  const browser = await puppeteer.launch({ 
    headless: "new",
    defaultViewport: { width: 1280, height: 800 } 
  });
  const page = await browser.newPage();
  
  console.log('Navigating to local server...');
  await page.goto('http://localhost:5173');
  
  console.log('Waiting for app to load...');
  await page.waitForSelector('#app', { timeout: 10000 });
  await wait(2000);
  
  try {
    const enterBtns = await page.$$('::-p-xpath(//button[contains(text(), "Enter the Sanctuary")])');
    if (enterBtns.length > 0) {
      await enterBtns[0].click();
      await wait(1000);
    }
  } catch(e) {}

  await wait(1000);
  
  await page.evaluate(() => { if(window.setCurrentScreen) window.setCurrentScreen('app'); if(window.handleTabClick) window.handleTabClick('grimoire'); });
  await wait(1000);

  // Click wash day button by evaluating script instead of relying on xpath
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const washDayBtn = btns.find(b => b.textContent.includes('Log Wash Day'));
    if (washDayBtn) washDayBtn.click();
  });
  await wait(1000);
  
  console.log('Taking screenshot: Wash Day Ledger');
  await page.screenshot({ path: 'C:/Users/purpl/.gemini/antigravity/brain/4d981e94-ffe7-43c4-9935-b754859ef1c0/screenshot_wash_day.png' });

  await browser.close();
  console.log('Done.');
})();
