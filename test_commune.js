import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Intercept the direct Anthropic call
  await page.route('**/v1/messages', async route => {
    const request = route.request();
    
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
      return;
    }
    
    const postData = JSON.parse(request.postData() || '{}');
    const messages = postData.messages || [];
    const userTurnCount = messages.filter(m => m.role === 'user').length;
    
    if (userTurnCount >= 2) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ content: [{ text: "I understand your path. [READING_COMPLETE: Adjusted rites for clarity]" }] })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ content: [{ text: "What troubles your spirit?" }] })
      });
    }
  });
  
  await page.goto('http://localhost:5175/?bypass=1');
  
  await page.evaluate(() => {
    localStorage.setItem('avatar_config', JSON.stringify({}));
    localStorage.setItem('intake_completed', 'true');
    localStorage.setItem('al_anthropic_key', 'sk-ant-dummy-key');
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'grim');
  });
  
  await page.goto('http://localhost:5175/?bypass=1');
  await page.waitForTimeout(2000);
  
  console.log("Clicking Commune");
  await page.click('text=Commune');
  await page.waitForTimeout(1000);
  
  console.log("Taking debug screenshot");
  await page.screenshot({ path: 'docs/proofs/2_commune_debug.png' });
  
  console.log("Filling text area");
  await page.fill('textarea[placeholder="Speak your truth..."]', 'I am feeling overwhelmed.');
  await page.click('text=Deliver unto the Keeper');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'docs/proofs/2_commune_completed.png' });
  
  await browser.close();
})();
