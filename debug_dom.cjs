const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 5000));
  const html = await page.evaluate(() => document.body.innerHTML);
  const fs = require('fs');
  fs.writeFileSync('C:/Users/purpl/shadowsanctuary/debug_dom.html', html);
  await browser.close();
  console.log("Debug DOM dumped");
})();
