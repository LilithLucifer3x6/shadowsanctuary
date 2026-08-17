const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await context.addInitScript(() => {
    localStorage.setItem('avatar_config', JSON.stringify({ preset: 'default' }));
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'rites');
    localStorage.setItem('intake_completed', 'true');
  });
  await page.goto('http://localhost:5173/?bypass=1');
  await page.waitForTimeout(3000);
  const html = await page.evaluate(() => document.body.innerHTML);
  require('fs').writeFileSync('docs/screenshots/debug_html.html', html);
  await browser.close();
})();
