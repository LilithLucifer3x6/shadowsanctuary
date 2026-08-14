const { chromium } = require('playwright');

async function snap() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  // Grimoire
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const t = tabs.find(t => t.textContent.includes('The Grimoire'));
    if (t) t.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\0be76408-6bc5-4ff5-a2bb-20a516df3f62\\grimoire_centered.png' });
  
  // Altars
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const t = tabs.find(t => t.textContent.includes('The Altars'));
    if (t) t.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\0be76408-6bc5-4ff5-a2bb-20a516df3f62\\altars_centered.png' });
  
  await browser.close();
}

snap().catch(console.error);
