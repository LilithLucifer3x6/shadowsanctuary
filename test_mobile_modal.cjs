const { chromium } = require('playwright');
const path = require('path');

async function main() {
  console.log("Launching browser for mobile UI screenshot...");
  const browser = await chromium.launch({ headless: true });
  
  // Set narrow mobile viewport
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true
  });
  const page = await context.newPage();
  
  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');
    
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
    await page.reload();
    await page.waitForTimeout(2000); 

    console.log("Clicking 'The Shadow Tome' tab...");
    // Use an exact selector for the tab button
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button.tb'));
      const shadowTab = tabs.find(t => t.innerText.includes('Shadow Tome'));
      if (shadowTab) shadowTab.click();
    });
    await page.waitForTimeout(2000);
    
    console.log("Clicking 'Ignite New Alchemy'...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button.btn.plum'));
      const igniteBtn = btns.find(b => b.innerText.includes('Ignite New Alchemy'));
      if (igniteBtn) igniteBtn.click();
    });
    
    await page.waitForTimeout(1000);
    console.log("Capturing Alchemy Modal mobile screenshot...");
    const dest = path.join('C:', 'Users', 'purpl', '.gemini', 'antigravity', 'brain', '1370394e-3b85-4504-bb15-db9d1cd803c0', 'alchemy_modal_mobile.png');
    await page.screenshot({ path: dest });

    console.log(`SUCCESS: Captured screenshot at ${dest}`);
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
}

main();
