const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/purpl/shadowsanctuary/docs/screenshots';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  // Inject state to bypass Landing and Auth
  await context.addInitScript(() => {
    localStorage.setItem('avatar_config', JSON.stringify({ preset: 'default' }));
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'rites');
    localStorage.setItem('intake_completed', 'true');
    sessionStorage.setItem('sb-bypass', 'true');
  });

  console.log("Loading app...");
  await page.goto('http://localhost:5174/?bypass=1');
  try {
    await page.waitForSelector('.tabs', { timeout: 10000 });
  } catch (e) {
    console.error("Timeout waiting for tabs.");
    await browser.close();
    return;
  }

  await page.waitForTimeout(1000);

  // 1. Wash Day Ledger
  console.log("1. Wash Day Ledger...");
  await page.click('.tb:has-text("Grimoire")');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Log Wash Day")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_wash_day.png') });
  await page.click('button:has-text("Abandon")');
  await page.waitForTimeout(1000);

  // 2. Shadow Tome disabled
  console.log("2. Shadow Tome disabled...");
  await page.click('.tb:has-text("Shadow Tome")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_shadow_tome_disabled.png') });

  // 3. Shadow Tome enabled
  console.log("3. Shadow Tome enabled...");
  await page.evaluate(() => {
    const sel = document.querySelector('select');
    if (sel) { sel.value = 'Mugwort'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_shadow_tome_enabled.png') });

  // 4. Scrying Pool
  console.log("4. Scrying Pool...");
  await page.click('.tb:has-text("Scrying Pool")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_scrying_pool.png') });

  // 5. Reading check-in
  console.log("5. Reading check-in...");
  await page.click('.tb:has-text("Grimoire")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_reading_logic.png') });

  // 6. Rootwork's Crypt restore (Scrying Pool Crypt)
  console.log("6. Crypt restore...");
  await page.click('.tb:has-text("Scrying Pool")');
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('h3'));
    const cryptBtn = btns.find(b => b.innerText.includes('Crypt of Ashes'));
    if(cryptBtn) cryptBtn.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_rootwork_restore.png') });

  // 7. Font settings after reload
  console.log("7. Font settings after reload...");
  await page.click('.ph-gear');
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    const sel = document.querySelectorAll('select')[0];
    if (sel) { sel.value = 'Lora'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await page.waitForTimeout(1000);
  await page.reload();
  await page.waitForSelector('.tabs', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await page.click('.ph-gear');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_font_persisted.png') });

  await browser.close();
  console.log("Done.");
}
run();
