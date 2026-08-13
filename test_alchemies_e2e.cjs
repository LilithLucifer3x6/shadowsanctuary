const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`[${new Date().toISOString()}] Starting Alchemies E2E Test...`);
  
  await page.goto('http://localhost:5173/');
  await page.evaluate(() => {
    localStorage.setItem('intake_completed', 'true');
    localStorage.setItem('avatar_config', JSON.stringify({ name: 'Test Witch', avatarVibe: 'none' }));
  });
  await page.goto('http://localhost:5173/');

  // Login
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.fill('#login-email', 'test-automation@shadowsanctuary.local');
  await page.fill('#login-password', 'TestPassword123!');
  await page.click('#login-submit');
  
  await page.waitForSelector('.tabs', { timeout: 15000 });
  console.log(`[${new Date().toISOString()}] Logged in successfully.`);

  // Navigate to Shadow Tome
  const shadowTomeBtn = await page.$('button:has-text("The Shadow Tome")');
  if (shadowTomeBtn) {
      await shadowTomeBtn.click();
  }

  try {
    // Wait for the button
    await page.waitForSelector('button:has-text("Ignite New Alchemy")', { timeout: 10000 });
    console.log(`[${new Date().toISOString()}] Navigated to Shadow Tome tab.`);

    // Click Ignite New Alchemy
    await page.click('button:has-text("Ignite New Alchemy")');
    await page.waitForSelector('h3:has-text("Ignite New Alchemy")');
    console.log(`[${new Date().toISOString()}] Opened Alchemy Modal.`);

    // Fill out the form
    const numInputs = await page.$$('input[type="number"]');
    await numInputs[0].fill('25'); // Potency
    await numInputs[1].fill('10'); // Oil ml
    await numInputs[2].fill('100'); // Honey ml
    await numInputs[3].fill('2'); // Lecithin ml
    
    const nameInputs = await page.$$('input[type="text"]');
    await nameInputs[0].fill('TEST - DO NOT USE Potion');
    
    await page.click('button:has-text("Ignite the Alchemy")');
    
    // Wait for it to appear
    await page.waitForSelector('text=TEST - DO NOT USE Potion');
    console.log(`[${new Date().toISOString()}] Successfully created new Alchemy: TEST - DO NOT USE Potion.`);

    // Register a Dram
    await page.click('button:has-text("Consecrate New Dram")');
    await page.waitForSelector('h3:has-text("Register a Dram")');
    
    // Using a more specific selector to avoid hitting invisible inputs from other forms
    await page.fill('.modal-content input[type="text"]', 'TEST - DO NOT USE Dram');
    await page.fill('.modal-content input[type="number"]', '5');
    
    await page.click('button:has-text("Register Dram")'); 
    
    await page.waitForSelector('text=TEST - DO NOT USE Dram');
    console.log(`[${new Date().toISOString()}] Successfully registered a Dram.`);

    // Log a Dose (Anoint)
    await page.click('button:has-text("Imbibe 1x TEST - DO NOT USE Dram")');
    await page.click('button:has-text("Anoint the Elixir")');
    
    console.log(`[${new Date().toISOString()}] Successfully logged a Dose.`);
    await page.screenshot({ path: path.join(__dirname, 'alchemies_e2e_evidence.png') });
    console.log(`[${new Date().toISOString()}] Screenshot saved to alchemies_e2e_evidence.png`);
  } catch (err) {
    console.error("Test failed.", err.message);
    const html = await page.content();
    console.log("================= DOM STATE AT TIMEOUT =================");
    console.log(html);
    console.log("========================================================");
    fs.writeFileSync(path.join(__dirname, 'alchemies_dom_dump.html'), html);
    await page.screenshot({ path: path.join(__dirname, 'alchemies_error.png') });
    console.log(`[${new Date().toISOString()}] Error screenshot saved to alchemies_error.png`);
  }

  await browser.close();
})();
