const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(require('os').homedir(), '.gemini/antigravity/brain/4d981e94-ffe7-43c4-9935-b754859ef1c0');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    // Mock user being logged in by injecting localStorage state
  });
  const page = await context.newPage();

  // Make sure to navigate first before setting localStorage, or set it via context.addInitScript
  await context.addInitScript(() => {
    localStorage.setItem('avatar_config', JSON.stringify({ preset: 'default' }));
    sessionStorage.setItem('al_currentScreen', 'app');
  });

  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  console.log("Saving app screenshot...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_app.png') });
  
  // App Lock
  console.log("Triggering AppLock...");
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_applock.png') });

  // Unlock it
  await page.evaluate(() => {
    const btn = document.querySelector('.keypad-btn');
    if(btn) btn.click();
    // this would require actual PIN... wait, let's just reload to bypass lock
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  // Navigate to Intake to show rebuilt quiz
  await page.evaluate(() => {
    sessionStorage.setItem('al_currentScreen', 'intake');
  });
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  console.log("Saving Intake screenshot...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_intake.png') });

  await browser.close();
}

run().catch(console.error);
