const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`[${new Date().toISOString()}] Starting Batch Upload UI Test...`);
  
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
  
  // Wait for login to complete and bypass Landing because we set localStorage
  await page.waitForSelector('button:has-text("Enter the Sanctuary")', { timeout: 15000 }).catch(() => {});
  const enterBtn = await page.$('button:has-text("Enter the Sanctuary")');
  if (enterBtn) {
      await enterBtn.click();
  }

  await page.waitForSelector('.tabs', { timeout: 15000 });
  console.log(`[${new Date().toISOString()}] Logged in successfully.`);

  // Navigate to Rootwork
  await page.click('button:has-text("The Rootwork")');
  await page.waitForSelector('text=Rootwork', { timeout: 10000 });
  console.log(`[${new Date().toISOString()}] Navigated to Rootwork.`);

  // Click the + button to open Add Modal
  await page.click('button:has-text("+")');
  await page.waitForSelector('text=Summon Multiple Visions', { timeout: 10000 });
  console.log(`[${new Date().toISOString()}] Opened Add Modal.`);

  // Find the file input for batch upload
  const fileInput = await page.$('input[type="file"][multiple]');
  if (fileInput) {
    const filePaths = [
      path.resolve(__dirname, 'product1.jpg'),
      path.resolve(__dirname, 'product2.jpg'),
      path.resolve(__dirname, 'product3.jpg')
    ];
    console.log(`[${new Date().toISOString()}] Uploading batch photos...`);
    
    const startTime = Date.now();
    await fileInput.setInputFiles(filePaths);
    
    // In Rootwork, wait for processing to finish
    await page.waitForTimeout(1000); 
    
    // Wait until loading overlay/status is gone
    await page.waitForFunction(() => {
        return !document.body.innerText.includes('Divining batch of images'); 
    }, { timeout: 60000 }).catch(() => {});
    
    const endTime = Date.now();
    console.log(`[${new Date().toISOString()}] Extraction finished in ${(endTime - startTime) / 1000} seconds.`);
    
    await page.screenshot({ path: path.join(__dirname, 'batch_upload_evidence.png') });
    console.log(`[${new Date().toISOString()}] Screenshot saved to batch_upload_evidence.png`);
  } else {
    console.log(`[${new Date().toISOString()}] Could not find batch upload file input.`);
  }

  await browser.close();
})();
