const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('al_currentScreen', 'app');
    localStorage.setItem('intake_completed', 'true');
    localStorage.setItem('avatar_config', JSON.stringify({ name: "Test User", avatarVibe: "witchy", familiar: "cat", layers: {} }));
  });
  const url = 'http://localhost:5173';
  await page.goto(url, { waitUntil: 'networkidle0' });
  console.log("Navigating to Rootwork...");
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.tb');
    for (let t of tabs) {
      if (t.title && t.title.includes('Rootwork')) t.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'rootwork-layout.png', fullPage: true });

  console.log("Looking for Inscribe/Summon button...");
  const btnClickResult = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    let target = null;
    for (let b of btns) {
      if (b.textContent.includes('Inscribe') || b.textContent.includes('Summon')) {
        target = b;
        break;
      }
    }
    if (target) {
      target.click();
      return "Clicked " + target.textContent;
    }
    return "Button not found";
  });
  console.log("Button action:", btnClickResult);

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'rootwork-modal.png' });
  await browser.close();
})();
