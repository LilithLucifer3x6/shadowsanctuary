const { chromium } = require('playwright');
const path = require('path');

async function main() {
  console.log("Launching browser for UI screenshot test...");
  const browser = await chromium.launch({ headless: true });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:5174');
    
    console.log("Logging in...");
    await page.fill('input[type="email"]', 'test_1786474323159@gmail.com');
    await page.fill('input[type="password"]', 'flux_test_password_123!');
    await page.click('#login-submit');
    
    // Wait for the login to process
    await page.waitForTimeout(3000);
    
    console.log("Injecting state bypasses...");
    await page.evaluate(() => {
      localStorage.setItem('intake_completed', 'true');
      localStorage.setItem('avatar_config', '{"test":"true"}');
    });
    // Reload to apply the forced state
    await page.reload();

    console.log("Waiting for tabs to load...");
    await page.waitForSelector('button.tb', { timeout: 15000 });
    await page.waitForTimeout(1000); 

    // --- SHADOW TOME (ALCHEMY) ---
    console.log("Clicking 'The Shadow Tome' tab...");
    await page.click('text="The Shadow Tome"');
    await page.waitForTimeout(1000);
    
    console.log("Clicking 'Ignite New Alchemy'...");
    await page.click('text="Ignite New Alchemy"');
    
    await page.waitForTimeout(1000);
    console.log("Capturing Alchemy Modal screenshot...");
    await page.screenshot({ path: path.join('public', 'assets', 'avatar-tests', 'alchemy_modal_fixed.png') });

    console.log("SUCCESS: Captured screenshot.");
  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    await browser.close();
  }
}

main();
