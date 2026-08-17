const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/purpl/shadowsanctuary/docs/screenshots';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await context.addInitScript(() => {
    localStorage.setItem('avatar_config', JSON.stringify({ preset: 'default' }));
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'tome');
    localStorage.setItem('intake_completed', 'true');
  });

  await page.goto('http://localhost:5173/?bypass=1');
  await page.waitForSelector('.tb', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // Take disabled screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_shadow_tome_disabled.png') });

  // Fill form to enable "Inscribe"
  await page.evaluate(() => {
    // 1. Click first action card
    const actionCards = Array.from(document.querySelectorAll('.card.p-sm'));
    if(actionCards.length) actionCards[0].click();
    
    // 2. Type target
    const inputs = document.querySelectorAll('input[type="text"]');
    if(inputs.length) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(inputs[0], 'Test Target');
      inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // 3. Click first ingredient
    const ings = Array.from(document.querySelectorAll('.ing-card'));
    if(ings.length) ings[0].click();
  });
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_shadow_tome_enabled.png') });

  await browser.close();
}

run().catch(console.error);
