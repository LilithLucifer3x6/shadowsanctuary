const { chromium } = require('playwright');
const path = require('path');

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
    
    await page.evaluate(() => {
      localStorage.setItem('intake_completed', 'true');
      localStorage.setItem('avatar_config', '{"test":"true"}');
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // Open settings
    await page.click('[title="Configurations"]');
    await page.waitForTimeout(1000);

    // Click shatter
    await page.click('button:has-text("Shatter the First Inscription")');
    await page.waitForTimeout(1000);
    
    // Custom React confirm dialog
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(2000);

    // Wait for Intake screen to load
    await page.waitForSelector('input[placeholder="Speak your mind..."]', { timeout: 10000 });

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

testFeature7();
