const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(require('os').homedir(), '.gemini/antigravity/brain/4d981e94-ffe7-43c4-9935-b754859ef1c0');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await context.addInitScript(() => {
    localStorage.setItem('avatar_config', JSON.stringify({ preset: 'default' }));
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'rites');
  });

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000); // Wait 3s to let the fetching resolve

  const text = await page.textContent('body');
  console.log("Body text contains 'Consulting the rites...':", text.includes('Consulting the rites...'));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot_mortal_rites.png') });
  await browser.close();
}

run().catch(console.error);
