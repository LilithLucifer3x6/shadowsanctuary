import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
    localStorage.setItem('avatar_config', JSON.stringify({ pose: 'working' }));
    localStorage.setItem('intake_completed', 'true');
    sessionStorage.setItem('al_currentScreen', 'landing');
  });
  await page.reload();
  await new Promise(r => setTimeout(r, 2000));
  const btns = await page.$$('.btn');
  for (const b of btns) {
    if ((await page.evaluate(el => el.textContent, b)).trim() === 'Enter') {
       await b.click();
       break;
    }
  }
  await new Promise(r => setTimeout(r, 2000));
  const body = await page.evaluate(() => document.body.innerHTML);
  console.log(body.substring(0, 1500));
  await browser.close();
})();
