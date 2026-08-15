const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.error('[BROWSER ERROR]:', err.message);
  });
  
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('intake_completed', 'true');
    localStorage.setItem('avatar_config', JSON.stringify({ name: "Test User", avatarVibe: "witchy", familiar: "cat", layers: {} }));
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Handle Login "The wards hold fast"
  await page.waitForSelector('input[type="password"]', { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (let input of inputs) {
      if (input.type === 'password' || input.placeholder.includes('Identify')) {
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(input, 'solstice');
        input.dispatchEvent(new Event('input', { bubbles: true}));
      }
    }
  });
  
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (let b of btns) {
      if (b.textContent.includes('Enter')) b.click();
    }
  });

  // wait for login to finish
  await page.waitForFunction(() => !document.body.innerText.includes('wards hold fast'), { timeout: 5000 });
  await new Promise(r => setTimeout(r, 1000));

  console.log("Navigating to Shadow Tome...");
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.tb');
    for (let t of tabs) {
      if (t.title && t.title.includes('Shadow Tome')) t.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log("In Shadow Tome?", pageText.includes('Inner Sanctum'));

  console.log("Clicking 'Seek in the Codex'...");
  const clickedSeek = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (let b of btns) {
      if (b.textContent.includes('Seek in the Codex')) {
        b.click();
        return true;
      }
    }
    return false;
  });
  console.log("Clicked Seek:", clickedSeek);

  await new Promise(r => setTimeout(r, 500));
  const modalVisible = await page.evaluate(() => {
    const el = document.querySelector('.modal.on');
    return el !== null;
  });
  console.log("Is modal visible?", modalVisible);

  await browser.close();
})();
