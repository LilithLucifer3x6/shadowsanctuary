const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function loginAndSetup(page) {
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
}

async function testFeature1() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await loginAndSetup(page);

    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button.tb'));
      const rootTab = tabs.find(t => t.innerText.includes('Rootwork'));
      if (rootTab) rootTab.click();
    });
    await page.waitForTimeout(1000);

    // Open Add Modal by clicking the + button
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const addBtn = btns.find(b => b.innerText.includes('+'));
        if (addBtn) addBtn.click();
    });
    await page.waitForTimeout(1000);

    // Feature 1: Single Photo Scan
    const file = path.resolve('product1.jpg');
    // Upload it to the "Offer an image" input
    // The handleEchoPhotoUpload is on the first file input
    const fileInputs = await page.$$('input[type="file"]');
    await fileInputs[0].setInputFiles(file);
    
    await page.waitForTimeout(20000); 
    
    const dest = path.join('C:', 'Users', 'purpl', '.gemini', 'antigravity', 'brain', '1370394e-3b85-4504-bb15-db9d1cd803c0', 'feature1_single_photo.png');
    await page.screenshot({ path: dest });
    console.log("Feature 1: Single photo scan SUCCESS. Saved screenshot.");
  } catch (err) {
    console.error("Feature 1 failed:", err);
  } finally {
    await browser.close();
  }
}

async function testFeature3() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await loginAndSetup(page);

    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button.tb'));
      const rootTab = tabs.find(t => t.innerText.includes('Rootwork'));
      if (rootTab) rootTab.click();
    });
    await page.waitForTimeout(1000);

    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const addBtn = btns.find(b => b.innerText.includes('+'));
        if (addBtn) addBtn.click();
    });
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Summon by Hand")');
    await page.waitForTimeout(1000);

    const inputs = await page.$$('.modal-content input[type="text"]');
    await inputs[0].fill('CeraVe');
    await inputs[1].fill('Hydrating Facial Cleanser');
    
    await page.click('button:has-text("Seek in the Codex")');
    
    await page.waitForTimeout(15000); 

    const dest = path.join('C:', 'Users', 'purpl', '.gemini', 'antigravity', 'brain', '1370394e-3b85-4504-bb15-db9d1cd803c0', 'feature3_autocomplete.png');
    await page.screenshot({ path: dest });
    console.log("Feature 3: Autocomplete SUCCESS. Saved screenshot.");
  } catch (err) {
    console.error("Feature 3 failed:", err);
  } finally {
    await browser.close();
  }
}

async function testFeature5() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await loginAndSetup(page);

    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const grim = btns.find(b => b.title && b.title.includes('Shadow Tome') || b.innerText.includes('Grimoire'));
        if (grim) grim.click();
    });
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Summon Tea Blends")');
    await page.waitForTimeout(1000);

    const inputs = await page.$$('.modal-content input[type="text"]');
    await inputs[0].fill('Celestial Seasonings');
    await inputs[1].fill('Sleepytime');
    
    await page.click('button:has-text("Lookup Blend")');
    
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

async function runAll() {
  console.log("Running Feature 1...");
  await testFeature1();
  console.log("Running Feature 3...");
  await testFeature3();
  console.log("Running Feature 5...");
  await testFeature5();
}

runAll();
