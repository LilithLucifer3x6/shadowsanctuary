import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:5175/?bypass=1');
  
  await page.evaluate(() => {
    localStorage.setItem('avatar_config', JSON.stringify({}));
    localStorage.setItem('intake_completed', 'true');
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'root');
  });
  
  await page.goto('http://localhost:5175/?bypass=1');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'docs/proofs/3_rootwork_layout.png', fullPage: true });
  
  await browser.close();
})();
