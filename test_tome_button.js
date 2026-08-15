import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to page first so we can set storage
  await page.goto('http://localhost:5175/?bypass=1');
  
  await page.evaluate(() => {
    localStorage.setItem('avatar_config', JSON.stringify({}));
    localStorage.setItem('intake_completed', 'true');
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'tome');
  });
  
  // Reload to apply storage state
  await page.goto('http://localhost:5175/?bypass=1');
  await page.waitForTimeout(2000);
  
  // 1. Shadow Tome disabled/enabled button states
  // The button should be disabled initially
  const button = await page.locator('#btn-save-tome');
  await button.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500); // let transition finish
  await page.screenshot({ path: 'docs/proofs/1_tome_button_disabled.png' });
  
  // Type something to enable the button
  await page.fill('textarea[placeholder="Etch your reflections..."]', 'A test reflection in the shadows.');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/proofs/1_tome_button_enabled.png' });
  
  await browser.close();
})();
