import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Handle alerts by storing their messages
  const alerts = [];
  page.on('dialog', dialog => {
    alerts.push(dialog.message());
    dialog.accept();
  });

  await page.goto('http://localhost:5175/?bypass=1');
  await page.evaluate(() => {
    localStorage.setItem('avatar_config', JSON.stringify({}));
    localStorage.setItem('intake_completed', 'true');
    sessionStorage.setItem('al_activeTab', 'root');
    sessionStorage.setItem('al_currentScreen', 'app');
  });
  
  // PATH 1: Echo Scry
  await page.goto('http://localhost:5175/?bypass=1');
  await page.waitForTimeout(2000);
  
  await page.fill('input[placeholder="Speak the relic\'s true name..."]', 'Lavender Lotion');
  await page.click('button:has-text("Divine Resonance")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'docs/proofs/8_lavender_echo.png' });
  
  // PATH 2: Shadow Tome Tea
  await page.evaluate(() => sessionStorage.setItem('al_activeTab', 'tome'));
  await page.goto('http://localhost:5175/?bypass=1');
  await page.waitForTimeout(2000);
  
  await page.click('button:has-text("Seek in the Codex")');
  await page.waitForTimeout(1000);
  await page.fill('input[placeholder="Brand / Lineage"]', 'Test');
  await page.fill('input[placeholder="Product / Blend Name"]', 'Lavender Tea');
  
  // Force manual skip by triggering the error or bypassing
  // Since we don't have bypass, we click Seek and wait for timeout/error
  await page.click('button:has-text("Seek in the Codex")');
  await page.waitForTimeout(5000);
  
  // Now we should be on candidates or confirm
  // If Candidates, we click 'None match'
  const fillManually = await page.$('button:has-text("None match")');
  if (fillManually) {
    await fillManually.click();
    await page.waitForTimeout(500);
  }
  
  await page.click('button:has-text("Summon")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/proofs/8_lavender_tome_tea.png' });
  
  // Close modal if open
  const abandonBtn = await page.$('button:has-text("Abandon")');
  if (abandonBtn) await abandonBtn.click();
  
  // PATH 3: Shadow Tome Alchemy
  await page.click('button:has-text("Synthesize")');
  await page.waitForTimeout(1000);
  await page.fill('input[placeholder="Name your synthesis"]', 'Lavender Extract');
  await page.fill('input[placeholder="Raw T-Check"]', '10');
  await page.fill('input[placeholder="Oil Vol"]', '10');
  await page.fill('input[placeholder="Honey Vol"]', '0');
  await page.fill('input[placeholder="Lecithin Vol"]', '0');
  
  await page.click('button:has-text("Synthesize Elixir")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/proofs/8_lavender_tome_alchemy.png' });
  
  console.log("Alerts triggered:", alerts);
  await browser.close();
})();
