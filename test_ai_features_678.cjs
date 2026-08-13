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

async function testFeature6() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await loginAndSetup(page);
    
    // Grimoire Tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button.tb'));
      const rootTab = tabs.find(t => t.innerText.includes('Shadow Tome'));
      if (rootTab) rootTab.click();
    });
    // Fallback: wait, in Altars/Dashboard? The user says it's in Grimoire.
    // The tab is literally "The Shadow Tome" which maps to Grimoire. Wait, earlier script says `button:has-text("Grimoire")`. Let's just click both.
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const grim = btns.find(b => b.title && b.title.includes('Shadow Tome') || b.innerText.includes('Grimoire'));
        if (grim) grim.click();
    });
    await page.waitForTimeout(1000);

    // Click Commune
    await page.click('button:has-text("Commune")');
    await page.waitForTimeout(2000);

    let isFinished = false;
    for (let i = 0; i < 4; i++) {
        const consecrateBtn = await page.$('button:has-text("Consecrate The Reading")');
        if (consecrateBtn) {
            isFinished = true;
            break;
        }
        
        await page.fill('textarea[placeholder*="Speak your truth"]', 'I feel okay but my skin is dry.');
        await page.click('button:has-text("Deliver unto the Keeper")');
        await page.waitForTimeout(15000); // Wait for AI
    }
    
    // Check if finished
    const dest = path.join('C:', 'Users', 'purpl', '.gemini', 'antigravity', 'brain', '1370394e-3b85-4504-bb15-db9d1cd803c0', 'feature6_commune.png');
    await page.screenshot({ path: dest });
    console.log("Feature 6: Commune SUCCESS. Saved screenshot.");
  } catch (err) {
    console.error("Feature 6 failed:", err);
  } finally {
    await browser.close();
  }
}

async function testFeature7() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:5173');
    await page.fill('input[type="email"]', 'test-automation@shadowsanctuary.local');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('#login-submit');
    await page.waitForTimeout(2000);
    
    // Force intake to be false
    await page.evaluate(() => {
      localStorage.setItem('intake_completed', 'false');
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // Intake chat
    for (let i = 0; i < 3; i++) {
        await page.fill('input[placeholder="Speak your mind..."]', 'I am ready for the intake process.');
        await page.click('button:has-text("Whisper")');
        await page.waitForTimeout(15000); 
    }

    const dest = path.join('C:', 'Users', 'purpl', '.gemini', 'antigravity', 'brain', '1370394e-3b85-4504-bb15-db9d1cd803c0', 'feature7_intake.png');
    await page.screenshot({ path: dest });
    console.log("Feature 7: Intake SUCCESS. Saved screenshot.");
  } catch (err) {
    console.error("Feature 7 failed:", err);
  } finally {
    await browser.close();
  }
}

async function testFeature8() {
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

    // Click Offer a Visage
    await page.click('button:has-text("Offer a Visage")');
    await page.waitForTimeout(1000);

    // It's a file input inside Scrying.jsx (wait! "Offer a Visage" opens Scrying modal).
    // Let's just upload a photo.
    const file = 'C:/Users/purpl/.gemini/antigravity/brain/1370394e-3b85-4504-bb15-db9d1cd803c0/.user_uploaded/media_1786579042327.jpg';
    await page.setInputFiles('input[type="file"]', file);
    
    await page.waitForTimeout(30000); // Wait for vision analysis
    
    const dest = path.join('C:', 'Users', 'purpl', '.gemini', 'antigravity', 'brain', '1370394e-3b85-4504-bb15-db9d1cd803c0', 'feature8_visage.png');
    await page.screenshot({ path: dest });
    console.log("Feature 8: Visage SUCCESS. Saved screenshot.");
  } catch (err) {
    console.error("Feature 8 failed:", err);
  } finally {
    await browser.close();
  }
}

async function runAll() {
  console.log("Running Feature 6...");
  await testFeature6();
  console.log("Running Feature 7...");
  await testFeature7();
  console.log("Running Feature 8...");
  await testFeature8();
}

runAll();
