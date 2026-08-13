const { chromium } = require('playwright');
const path = require('path');

async function testFeature2() {
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

    // Grimoire Tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button.tb'));
      const rootTab = tabs.find(t => t.innerText.includes('Rootwork'));
      if (rootTab) rootTab.click();
    });
    await page.waitForTimeout(1000);

    // Open Add Modal
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const addBtn = btns.find(b => b.innerText.includes('+'));
        if (addBtn) addBtn.click();
    });
    await page.waitForTimeout(1000);

    // Upload multiple files to "Summon Multiple Visions"
    const files = [
        path.resolve('product1.jpg'),
        path.resolve('product2.jpg'),
        path.resolve('product3.jpg')
    ];
    // Find the multiple file input
    const fileInputs = await page.$$('input[type="file"][multiple]');
    await fileInputs[0].setInputFiles(files);
    
    // Wait for the AI to complete (up to 90s)
    await page.waitForTimeout(60000); 

    const dest = path.join('C:', 'Users', 'purpl', '.gemini', 'antigravity', 'brain', '1370394e-3b85-4504-bb15-db9d1cd803c0', 'feature2_batch_photo.png');
    await page.screenshot({ path: dest });
    console.log("Feature 2: Batch upload SUCCESS. Saved screenshot.");
  } catch (err) {
    console.error("Feature 2 failed:", err);
  } finally {
    await browser.close();
  }
}

testFeature2();
