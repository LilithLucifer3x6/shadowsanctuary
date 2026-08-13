const { chromium } = require('playwright');
const path = require('path');

async function main() {
  console.log("Launching browser for REAL Rootwork batch upload UI test...");
  const browser = await chromium.launch({ headless: true });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');
    
    console.log("Logging in...");
    await page.fill('input[type="email"]', 'test_1786474323159@gmail.com');
    await page.fill('input[type="password"]', 'flux_test_password_123!');
    await page.click('#login-submit');
    
    await page.waitForTimeout(3000);
    
    console.log("Injecting state bypasses...");
    await page.evaluate(() => {
      localStorage.setItem('intake_completed', 'true');
      localStorage.setItem('avatar_config', '{"test":"true"}');
    });
    await page.reload();
    await page.waitForTimeout(2000); 

    console.log("Clicking 'Rootwork' tab...");
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button.tb'));
      const rootTab = tabs.find(t => t.innerText.includes('Rootwork'));
      if (rootTab) rootTab.click();
    });
    await page.waitForTimeout(2000);
    
    console.log("Opening Camera/Upload modal...");
    await page.click('text="Capture Vision"');
    await page.waitForTimeout(1000);

    console.log("Uploading 3 REAL product images to Rootwork via the UI...");
    const files = [
      path.resolve('product1.jpg'),
      path.resolve('product2.jpg'),
      path.resolve('product3.jpg')
    ];
    
    await page.setInputFiles('input[type="file"][multiple]', files);
    
    console.log("Waiting for analysis to complete (timeout up to 90s, Anthropic is slow)...");
    
    await page.waitForSelector('text="Add to Reliquary"', { timeout: 90000 });
    
    console.log("Analysis completed! Extracting identified item names from the UI...");
    
    const itemNames = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
      return inputs.map(i => i.value).filter(v => v.trim() !== '');
    });
    
    console.log("\n--- RESULTING IDENTIFIED ITEMS ---");
    itemNames.forEach((name, i) => console.log(`${i+1}. ${name}`));
    console.log("----------------------------------\n");

    console.log("Capturing screenshot of the successful extraction...");
    const dest = path.join('C:', 'Users', 'purpl', '.gemini', 'antigravity', 'brain', '1370394e-3b85-4504-bb15-db9d1cd803c0', 'rootwork_real_batch_success.png');
    await page.screenshot({ path: dest });

    console.log(`SUCCESS: Captured screenshot at ${dest}`);
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
}

main();
