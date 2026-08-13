import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 400, height: 800 } // Mobile-like viewport
  });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173');
  
  // Wait for the app to load
  await page.waitForSelector('nav');
  
  // Click Grimoire tab (usually the second or third nav item, look for text "Grimoire")
  await page.click('text=Grimoire');
  
  // Wait for Grimoire to load
  await page.waitForSelector('text=The Reading');
  
  // Click "Commune"
  await page.click('text=Commune');
  
  // Wait for the Reading modal to appear (look for "Deliver unto the Keeper.")
  await page.waitForSelector('text=Deliver unto the Keeper.');
  
  // Take a screenshot
  await page.screenshot({ path: 'artifacts/reading_button_screenshot.png' });
  
  await browser.close();
})();
