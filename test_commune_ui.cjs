const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  console.log("Launching browser for Commune test...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
      const [key, ...val] = line.split('=');
      if (key) acc[key.trim()] = val.join('=').trim();
      return acc;
    }, {});
    
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');
    
    // Auth login
    console.log("Logging in...");
    await page.fill('input[type="email"]', 'test_1786474323159@gmail.com');
    await page.fill('input[type="password"]', 'flux_test_password_123!');
    await page.click('button:has-text("Enter Sanctuary")');
    
    // Wait for the Dashboard
    console.log("Waiting for Grimoire/Dashboard...");
    await page.waitForSelector('text=The Keeper of the Tome', { timeout: 10000 });
    
    console.log("Clicking 'Commune' button...");
    await page.click('button:has-text("Commune")');
    
    // Check if the reading modal opened by looking for the input or the submit button
    console.log("Checking if Reading Flow modal opened...");
    await page.waitForSelector('text=What troubles your spirit?', { timeout: 5000 });
    await page.waitForSelector('button:has-text("Deliver unto the Keeper")', { timeout: 5000 });
    
    console.log("SUCCESS: The Commune button successfully opened the Reading Flow modal in a live authenticated session.");
    await page.screenshot({ path: 'artifacts/commune_modal_success.png' });
    console.log("Saved screenshot to artifacts/commune_modal_success.png");

  } catch (err) {
    console.error("Test failed:", err.message);
    await page.screenshot({ path: 'artifacts/commune_modal_fail.png' });
  } finally {
    await browser.close();
  }
}

main();
