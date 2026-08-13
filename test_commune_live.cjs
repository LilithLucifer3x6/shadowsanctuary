const { chromium } = require('playwright');

async function main() {
  console.log("Launching browser for Commune test on Vercel...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to live app...");
    await page.goto('https://shadowsanctuary.vercel.app');
    
    // Auth login
    console.log("Logging in...");
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'test_1786474323159@gmail.com');
    await page.fill('input[type="password"]', 'flux_test_password_123!');
    await page.click('#login-submit');
    
    console.log("Waiting for Grimoire dashboard to load (waiting for Commune button)...");
    await page.waitForSelector('button:has-text("Grimoire")', { timeout: 10000 });
    await page.click('button:has-text("Grimoire")');
    
    await page.waitForSelector('button:has-text("Commune")', { timeout: 15000 });
    
    console.log("Clicking 'Commune' button...");
    await page.click('button:has-text("Commune")');
    
    console.log("Checking if Reading Flow modal opened...");
    // The reading modal has an input placeholder "What troubles your spirit?" and a button "Deliver unto the Keeper"
    await page.waitForSelector('button:has-text("Deliver unto the Keeper")', { timeout: 5000 });
    
    console.log("SUCCESS: The Commune button successfully opened the Reading Flow modal in a live authenticated session.");
    await page.screenshot({ path: 'artifacts/commune_modal_success_live.png' });
    console.log("Saved screenshot to artifacts/commune_modal_success_live.png");

  } catch (err) {
    console.error("Test failed:", err.message);
    await page.screenshot({ path: 'artifacts/commune_modal_fail_live.png' });
  } finally {
    await browser.close();
  }
}

main();
