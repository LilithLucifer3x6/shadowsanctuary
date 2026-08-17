const { chromium } = require('playwright');
const path = require('path');
const ARTIFACT_DIR = 'C:/Users/purpl/shadowsanctuary/docs/screenshots';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1200 } });
  const page = await context.newPage();

  await context.addInitScript(() => {
    localStorage.setItem('avatar_config', JSON.stringify({ preset: 'default' }));
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'grimoire');
    localStorage.setItem('intake_completed', 'true');
    sessionStorage.setItem('sb-bypass', 'true');
  });

  await page.goto('http://localhost:5174/?bypass=1');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_grimoire_5cards.png'), fullPage: true });

  await browser.close();
}
run();
