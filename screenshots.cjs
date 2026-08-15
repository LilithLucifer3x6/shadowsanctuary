const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 896 });
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  try {
    await page.type('input[type=\"email\"]', 'purpleirishlilli69@gmail.com');
    await page.type('input[type=\"password\"]', 'purpleirishlilli69');
    await page.click('button.btn.plum');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(()=>{});
  } catch(e) {}
  
  // 1. Rootwork Layout 2x2
  await page.goto('http://localhost:5173/rootwork', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'rootwork-2x2.png', fullPage: true });
  
  // 2. Altars 3x2
  await page.goto('http://localhost:5173/altars', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'altars-3x2.png' });
  
  // 3. Mortal Rites Title Sizing
  await page.goto('http://localhost:5173/mortal-rites', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'mortal-rites-headers.png' });

  // 4. Shadow Tome Buttons Disabled State
  await page.goto('http://localhost:5173/shadow-tome', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card'));
    if(cards[1]) cards[1].click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'shadowtome-disabled.png' });

  await browser.close();
})();
