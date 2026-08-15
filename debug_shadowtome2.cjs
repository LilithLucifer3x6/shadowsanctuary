const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('intake_completed', 'true');
    localStorage.setItem('avatar_config', JSON.stringify({ name: "Test User", avatarVibe: "witchy", familiar: "cat", layers: {} }));
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (let input of inputs) {
      if (input.type === 'password' || input.placeholder.includes('Identify')) {
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(input, 'solstice');
        input.dispatchEvent(new Event('input', { bubbles: true}));
      }
    }
    const btns = document.querySelectorAll('button');
    for (let b of btns) {
      if (b.textContent.includes('Enter')) b.click();
    }
  });

  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.tb');
    for (let t of tabs) {
      if (t.title && t.title.includes('Shadow Tome')) t.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log("PAGE TEXT:", text.substring(0, 500));

  await browser.close();
})();
