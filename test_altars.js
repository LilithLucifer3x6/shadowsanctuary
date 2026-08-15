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
    sessionStorage.setItem('al_activeTab', 'altars');
  });
  
  await page.goto('http://localhost:5175/?bypass=1');
  await page.waitForTimeout(2000);
  
  // 1024px
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/proofs/4_altars_1024.png' });
  
  // 768px
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/proofs/4_altars_768.png' });
  
  // 375px
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/proofs/4_altars_375.png' });
  
  await browser.close();
})();
