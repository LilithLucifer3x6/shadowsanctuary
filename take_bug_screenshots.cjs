const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.join(__dirname, 'docs', 'screenshots');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Grimoire
  await context.addInitScript(() => {
    localStorage.setItem('avatar_config', JSON.stringify({ preset: 'default' }));
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'grimoire');
  });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_grimoire_glyphs.png') });

  // 2. Settings Modal with TTS Dropdown & Corporeal Sensors fixed
  await page.evaluate(() => {
    // Check TTS to show dropdown
    const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
    settings.tts = true;
    localStorage.setItem('app_settings', JSON.stringify(settings));
  });
  await page.reload();
  await page.waitForTimeout(1000);
  // Open settings
  await page.evaluate(() => {
    const btn = document.querySelector('.btn.gh'); // Settings button
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_settings_modal.png') });

  // 3. AppLock (rewording)
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_applock_rewording.png') });

  // 4. Mortal Rites (Confirm loading hang is cleared)
  await page.evaluate(() => {
    sessionStorage.setItem('al_activeTab', 'rites');
  });
  // We need to reload to bypass AppLock and get to Rites
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_mortal_rites_loaded.png') });

  await browser.close();
}

run().catch(console.error);
