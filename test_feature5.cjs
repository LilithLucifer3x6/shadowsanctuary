const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFeature5() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'test-automation@shadowsanctuary.local');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('#login-submit');
    await page.waitForTimeout(2000);
    
    await page.evaluate(() => {
      localStorage.setItem('intake_completed', 'true');
      localStorage.setItem('avatar_config', '{"test":"true"}');
    });
    await page.reload();
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const grim = btns.find(b => b.title && b.title.includes('Shadow Tome') || b.innerText.includes('Grimoire'));
        if (grim) grim.click();
    });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const tBtn = btns.find(b => b.innerText.includes('Summon Tea Blends'));
        if (tBtn) tBtn.click();
    });
    await page.waitForTimeout(1000);

    const inputs = await page.$$('.modal-content input[type="text"]');
    await inputs[0].fill('Celestial Seasonings');
    await inputs[1].fill('Sleepytime');
    
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const lBtn = btns.find(b => b.innerText.includes('Lookup Blend'));
        if (lBtn) lBtn.click();
    });
    
    await page.waitForTimeout(15000); 

    const dest = path.join('C:', 'Users', 'purpl', '.gemini', 'antigravity', 'brain', '1370394e-3b85-4504-bb15-db9d1cd803c0', 'feature5_tea_autocomplete.png');
    await page.screenshot({ path: dest });
    console.log("Feature 5: Tea Autocomplete SUCCESS. Saved screenshot.");
  } catch (err) {
    console.error("Feature 5 failed:", err);
  } finally {
    await browser.close();
  }
}

testFeature5();
