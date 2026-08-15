const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to a standard mobile size 
  await page.setViewport({ width: 1200, height: 800 }); // iPhone 12/13/14 size (close to 9:16)

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('intake_completed', 'true');
    localStorage.setItem('avatar_config', JSON.stringify({ name: "Test User", avatarVibe: "witchy", familiar: "cat", layers: {} }));
  });

  const url = 'http://localhost:5173';
  await page.setCacheEnabled(false);
  await page.goto(url, { waitUntil: 'networkidle0' });

  console.log("Screenshotting Landing (Manor Exterior)...");
  await page.screenshot({ path: 'public/assets/avatar-tests/desktop_screenshot_landing.png' });

  // Click 'Enter the Sanctuary' (Landing -> App)
  await page.waitForSelector('.btn'); await page.click('.btn');
    await new Promise(r => setTimeout(r, 1000));
  
  // Now in Rites
  console.log("Screenshotting Mortal Rites...");
  await page.screenshot({ path: 'public/assets/avatar-tests/desktop_screenshot_rites.png' });

  // Array of tabs to click and screenshot
  const tabs = [
    { id: 'grim', name: 'Grimoire' },
    { id: 'altars', name: 'Altars' },
    { id: 'root', name: 'Rootwork' },
    { id: 'pool', name: 'Scrying_Pool' },
    { id: 'tome', name: 'Shadow_Tome' }
  ];

  for (const tab of tabs) {
    console.log(`Clicking ${tab.name}...`);
    // Find the button with this text
    const elements = await page.$$('.tb');
    for (let el of elements) {
      const text = await el.evaluate(x => x.textContent);
      if (text.includes(tab.name.replace('_', ' '))) {
        await el.click();
          await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }
    console.log(`Screenshotting ${tab.name}...`);
    await page.screenshot({ path: `public/assets/avatar-tests/desktop_screenshot_${tab.id}.png` });
  }

  await browser.close();
  console.log("Screenshots completed!");
})();
