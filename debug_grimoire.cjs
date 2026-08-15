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

  // Handle Login "The wards hold fast"
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    for (let input of inputs) {
      if (input.type === 'password' || input.placeholder.includes('Identify')) {
        input.value = 'solstice';
        // React 16+ requires setting value natively and dispatching event
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(input, 'solstice');
        let ev2 = new Event('input', { bubbles: true});
        input.dispatchEvent(ev2);
      }
    }
    const btns = document.querySelectorAll('button');
    for (let b of btns) {
      if (b.textContent.includes('Enter')) b.click();
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  console.log("Navigating to Grimoire...");
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.tb');
    for (let t of tabs) {
      if (t.title && t.title.includes('Grimoire')) t.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  console.log("Clicking Commune...");
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (let b of btns) {
      if (b.textContent.includes('Commune with the Keeper')) {
        b.click();
        break;
      }
    }
  });

  console.log("Waiting 10 seconds...");
  await new Promise(r => setTimeout(r, 10000));
  
  const chat = await page.evaluate(() => {
    const el = document.querySelector('.modal-content');
    return el ? el.innerText : document.body.innerText;
  });
  console.log("Modal text:\n", chat);
  await browser.close();
})();
