const puppeteer = require('puppeteer');
const fs = require('fs');
if (!fs.existsSync('docs/proofs')) {
  fs.mkdirSync('docs/proofs', { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 414, height: 896 });
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('avatar_config', JSON.stringify({}));
    localStorage.setItem('intake_completed', 'true');
  });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });

  try {
    // Fill in the Supabase login form
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.type('#login-email', 'playwright_tester_99@gmail.com');
    await page.type('#login-password', 'password123');
    await page.click('#login-submit');
    
    // Wait for the login to process and the Landing page to appear
    await page.waitForSelector('button', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));
    
    // Click the Enter button on the Landing page
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const enterBtn = btns.find(b => b.textContent.includes('Enter the Sanctuary'));
      if (enterBtn) enterBtn.click();
    });
    
    // Wait for the app tab bar to load
    await page.waitForSelector('.tb', { timeout: 10000 });
  } catch(e) {
    console.log('Tabs still not visible?', e);
  }
  
  async function clickTab(title) {
    await page.evaluate((t) => {
      const tabs = Array.from(document.querySelectorAll('.tb'));
      const tab = tabs.find(el => el.title === t);
      if (tab) tab.click();
    }, title);
    await new Promise(r => setTimeout(r, 1000));
  }

  // 1. Shadow Tome Button Disabled/Enabled States
  await clickTab('The Shadow Tome');
  await new Promise(r => setTimeout(r, 1000));
  
  
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Bind the Parchment'));
      if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 500));


    // Scroll to the button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Bind the Parchment'));
      if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 500));
    
    // Empty state (button disabled)
  await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/1a-shadow-tome-disabled.png' });
  
  // Fill the form to enable the button
  const textareas = await page.$$('textarea');
  if (textareas.length > 0) {
    await textareas[0].type('Reflecting on the rituals...');
  }
  await new Promise(r => setTimeout(r, 500));
  
  // Filled state (button enabled)
  await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/1b-shadow-tome-enabled.png' });

  // 2. Mortal Rites Header Sizing
  await clickTab('The Mortal Rites');
  await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/2-mortal-rites.png' });

  // 3. Lavender Ban (Manual Rootwork Add)
  await clickTab('The Rootwork');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Summon') || b.textContent.includes('The Apothecary'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  const inputsRW = await page.$$('input[type="text"]');
  if (inputsRW.length > 0) {
    await inputsRW[0].type('Lavender Essential Oil');
  }
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Save'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/3-lavender-ban.png' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const cancel = btns.find(b => b.textContent.includes('Cancel'));
    if (cancel) cancel.click();
  });

  // 4. Commune AI Regression Fix
  await clickTab('The Grimoire');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.trim() === 'Commune');
      if (btn) btn.scrollIntoView({ behavior: 'instant', block: 'center' });
    if (btn) btn.click();
  });
  
  // Wait for the modal and the AI's initial greeting
  await page.waitForSelector('.modal', { timeout: 10000 }).catch(()=>{});
  await new Promise(r => setTimeout(r, 3000));
  
  const grimoireInput = await page.$('.modal textarea');
  if (grimoireInput) {
    await grimoireInput.type('My skin is feeling unusually dry this week.');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.modal button'));
      const btn = btns.find(b => b.textContent.includes('Deliver'));
      if (btn) btn.click();
    });
    // Wait for AI response to stream in fully
    await new Promise(r => setTimeout(r, 12000));
  }
  await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/4-commune-regression.png' });
  
  // Close the modal to leave the UI clean for next tests
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.modal button'));
    const abandonBtn = btns.find(b => b.textContent.includes('Abandon'));
    if (abandonBtn) abandonBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 5. Altars 3x2 Grid
  await clickTab('The Altars');
  await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/5-altars-3x2.png' });

  // 6. Rootwork 2x2 Grid
  await clickTab('The Rootwork');
  await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/6-rootwork-2x2.png' });

  // 7. Global Modal Positioning
  await clickTab('The Scrying Pool');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('New'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/7-modal-positioning.png' });

  // 8. Glyph Audit
  await clickTab('The Rootwork');
  await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/8-glyph-audit.png' });

  // 9. Rootwork Add Button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Summon'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluateHandle('document.fonts.ready'); await page.screenshot({ path: 'docs/proofs/9-rootwork-add.png' });

  console.log('Finished capturing all screenshots!');
  await browser.close();
})();
