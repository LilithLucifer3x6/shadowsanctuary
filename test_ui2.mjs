import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
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
      await page.waitForTimeout(3000);
    }

    console.log("Checking Shadow Tome Mood Picker...");
    await page.goto('http://localhost:5173/shadow-tome');
    await page.waitForTimeout(2000);
    // Check if moods are loaded
    const moodLoaded = await page.locator('#tome-moods .chip').count();
    console.log("Moods loaded:", moodLoaded > 0 ? "YES" : "NO");

    console.log("Checking First Inscription (Intake)...");
    await page.goto('http://localhost:5173/intake');
    await page.waitForTimeout(2000);
    const intakeTitle = await page.locator('h2:has-text("The First Inscription")').isVisible();
    console.log("First Inscription accessible:", intakeTitle ? "YES" : "NO");

    console.log("Testing First Inscription chat...");
    const input = page.locator('input[type="text"]').first();
    if (await input.isVisible()) {
      await input.fill('I am ready');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      const reply = await page.locator('.modal-content div:has-text("I am ready")').isVisible();
      console.log("First Inscription chat works:", reply ? "YES" : "NO");
    }
    
    console.log("Checking Grimoire Commune button...");
    await page.goto('http://localhost:5173/grimoire');
    await page.waitForTimeout(2000);
    const communeBtn = page.locator('button:has-text("Commune")').first();
    let communeWorks = false;
    if (await communeBtn.isVisible()) {
      await communeBtn.click();
      await page.waitForTimeout(1000);
      const submitBtn = page.locator('button:has-text("Deliver unto the Keeper.")').first();
      communeWorks = await submitBtn.isVisible();
    }
    console.log("Commune button works & labeled 'Deliver unto the Keeper.':", communeWorks ? "YES" : "NO");
    
  } catch (err) {
    console.error("Error during tests:", err);
  } finally {
    await browser.close();
  }
})();
