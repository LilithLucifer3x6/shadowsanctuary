import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 400, height: 800 }
  });
  const page = await context.newPage();
  
  try {
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');
    
    // Login if needed
    if (await page.locator('input[type="email"]').isVisible()) {
      console.log("Logging in...");
      await page.fill('input[type="email"]', 'test_1786474323159@gmail.com');
      await page.fill('input[type="password"]', 'flux_test_password_123!');
      await page.click('button:has-text("Enter Sanctuary")');
      await page.waitForTimeout(2000);
    }
    
    // 1. Rootwork - Sacred Constituents
    console.log("Checking Rootwork...");
    await page.click('text=Rootwork');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Summon by Hand")');
    await page.waitForTimeout(500);
    
    // Fill step 1
    await page.fill('input[placeholder="e.g. OSEA, Fenty, Custom"]', 'Test Brand');
    await page.fill('input[placeholder="e.g. Undaria Algae Body Oil"]', 'Test Oil');
    await page.selectOption('select', 'Vessel'); // Vessel (Body)
    await page.click('button:has-text("Seek in the Codex")');
    await page.waitForTimeout(2000); // Wait for search
    
    // Click "None match — fill manually"
    await page.click('button:has-text("None match — fill manually")');
    await page.waitForTimeout(1000);
    
    // Screenshot Rootwork Confirm Step showing Sacred Constituents
    await page.screenshot({ path: 'artifacts/rootwork_constituents.png', fullPage: true });
    console.log("Rootwork screenshot taken.");
    
    // Close modal
    await page.click('button:has-text("Abandon")');
    
    // 2 & 4. Grimoire - Commune button and Reading flow
    console.log("Checking Grimoire...");
    await page.click('text=Grimoire');
    await page.waitForTimeout(1000);
    
    // Check if "Commune" button is there and works
    const communeBtn = page.locator('button:has-text("Commune")').first();
    await communeBtn.click();
    await page.waitForTimeout(1000);
    
    // Screenshot Reading flow showing "Deliver unto the Keeper."
    await page.screenshot({ path: 'artifacts/grimoire_reading.png' });
    console.log("Grimoire screenshot taken.");
    
    // Close Reading
    await page.click('button:has-text("Abandon")'); // Wait, is there an Abandon button for Reading? Or close icon? 
    // Actually, just navigate away
    
    // 3. Altars alignment
    console.log("Checking Altars...");
    await page.click('text=Altars');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'artifacts/altars_alignment.png' });
    console.log("Altars screenshot taken.");

    // 5. First Inscription / Mood picker
    console.log("Checking Sanctuary (Dashboard)...");
    await page.click('text=Sanctuary');
    await page.waitForTimeout(1000);
    
    // Click mood picker "+ Inscribe"
    const inscribeBtn = page.locator('button:has-text("+ Inscribe")').first();
    if (await inscribeBtn.isVisible()) {
      await inscribeBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'artifacts/mood_picker.png' });
      console.log("Mood picker screenshot taken.");
    } else {
      console.log("Mood picker button not found, might already have an inscription today.");
    }
    
  } catch (err) {
    console.error("Error during tests:", err);
  } finally {
    await browser.close();
  }
})();
