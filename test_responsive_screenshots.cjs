const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Bypass login/landing
  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('al_currentScreen', 'app');
    localStorage.setItem('intake_completed', 'true');
    localStorage.setItem('avatar_config', JSON.stringify({ name: "Test User", avatarVibe: "witchy", familiar: "cat", layers: {} }));
  });

  const url = 'http://localhost:5173';
  await page.setCacheEnabled(false);
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Switch to Mortal Rites tab (good for testing center cropping)
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.tb');
    for (let t of tabs) {
      if (t.textContent.includes('Mortal Rites')) t.click();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  const viewports = [
    { name: 'phone', width: 390, height: 844 },
    { name: 'tablet', width: 810, height: 1080 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'ultrawide', width: 2560, height: 1080 }
  ];

  for (const vp of viewports) {
    console.log(`Screenshotting ${vp.name}...`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await new Promise(r => setTimeout(r, 1000)); // wait for resize
    await page.screenshot({ path: `screenshot_rootwork_${vp.name}.png` });
  }

  await browser.close();
  console.log("Responsive screenshots completed!");
})();
