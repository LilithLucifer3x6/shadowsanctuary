import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // Login
    await page.fill('input[type="email"]', 'test_1786474323159@gmail.com');
    await page.fill('input[type="password"]', 'flux_test_password_123!');
    await page.click('button:has-text("Enter Sanctuary")');
    await page.waitForTimeout(4000); // Wait for auth to complete

    // Go to Rootwork
    await page.click('text=Rootwork');
    await page.waitForTimeout(2000);
    
    // Click Add Relic / Summon by Hand
    await page.click('button:has-text("Summon by Hand")');
    await page.waitForTimeout(1000);

    // Fill seed step
    await page.fill('input[placeholder="e.g. OSEA, Fenty, Custom"]', 'Custom');
    await page.fill('input[placeholder="e.g. Undaria Algae Body Oil"]', 'Bath Soak');
    await page.selectOption('select', 'Vessel'); // Vessel
    await page.click('button:has-text("Seek in the Codex")');
    await page.waitForTimeout(2000);

    // Click none match
    await page.click('button:has-text("None match — fill manually")');
    await page.waitForTimeout(2000);

    // Screenshot the form
    await page.screenshot({ path: 'artifacts/rootwork_constituents.png', fullPage: true });

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();
