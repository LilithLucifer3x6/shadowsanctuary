const puppeteer = require('puppeteer');
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#app', { timeout: 10000 });
  await wait(2000);

  await page.evaluate(() => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #1a1618; z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white;">
        <h2 style="font-family: 'Pinyon Script', cursive; font-size: 3rem; color: #d8c8a8; margin-bottom: 2rem;">The Herbarium Glyph Check</h2>
        <div style="display: flex; gap: 4rem; text-align: center;">
          <div>
            <i class="ph-duotone ph-coffee" style="font-size: 5rem; color: #a478b0;"></i>
            <p style="margin-top: 1rem; color: #c0b0c8; font-size: 1.2rem;">Morning Respite<br>(ph-coffee)</p>
          </div>
          <div>
            <i class="ph-duotone ph-mug" style="font-size: 5rem; color: #a478b0;"></i>
            <p style="margin-top: 1rem; color: #c0b0c8; font-size: 1.2rem;">Afternoon Respite<br>(ph-mug)</p>
          </div>
          <div>
            <i class="ph-duotone ph-teapot" style="font-size: 5rem; color: #a478b0;"></i>
            <p style="margin-top: 1rem; color: #c0b0c8; font-size: 1.2rem;">The Herbarium<br>(ph-teapot)</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  });

  await wait(1000);
  await page.screenshot({ path: 'C:/Users/purpl/.gemini/antigravity/brain/4d981e94-ffe7-43c4-9935-b754859ef1c0/screenshot_tea_icons.png' });
  await browser.close();
})();
