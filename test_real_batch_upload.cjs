const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testUpload() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:5173/');

  // Login first to authenticate the browser session
  console.log('Authenticating Test User...');
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
      await page.type('input[type="email"]', 'test-automation@shadowsanctuary.local');
      await page.type('input[type="password"]', 'TestPassword123!');
      await page.evaluate(() => {
          const btn = document.querySelector('form button[type="submit"]');
          if (btn) btn.click();
      });
      await page.waitForTimeout(3000); // Wait for auth to process and redirect
  } else {
      console.log('No login form found. Assuming already authenticated or auth disabled.');
  }

  // Force bypass the intake and avatar screens
  await page.evaluate(() => {
      localStorage.setItem('avatar_config', JSON.stringify({ name: 'Automaton' }));
      localStorage.setItem('intake_completed', 'true');
      sessionStorage.setItem('al_currentScreen', 'app');
  });
  await page.goto('http://localhost:5173/'); // Reload to apply bypass
  await page.waitForTimeout(2000);
  
  console.log('Navigating to The Rootwork...');
  await page.waitForSelector('.tb', { timeout: 10000 });
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tb'));
    const t = tabs.find(t => t.textContent.includes('The Rootwork'));
    if (t) t.click();
  });
  
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: `C:\\Users\\purpl\\.gemini\\antigravity\\brain\\0be76408-6bc5-4ff5-a2bb-20a516df3f62\\rootwork_before_add.png` });
  
  console.log('Clicking Add Relic (+)...');
  const addBox = await page.evaluate(() => {
    const icon = document.querySelector('button .ph-plus');
    if (icon && icon.parentElement) {
      const rect = icon.parentElement.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
    return null;
  });
  if (addBox) {
    await page.mouse.click(addBox.x, addBox.y);
  }
  
  await page.waitForTimeout(2000);
  
  console.log('Uploading REAL product photo...');
  try {
    // Wait for the file input in the modal to appear
    const fileInput = await page.waitForSelector('input[type="file"][multiple]', { state: 'attached', timeout: 5000 });
    if (fileInput) {
      const realPhotoPath = 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\0be76408-6bc5-4ff5-a2bb-20a516df3f62\\.user_uploaded\\media_1786653265006.jpg';
      await fileInput.setInputFiles(realPhotoPath);
      console.log('Photo selected for AI upload.');
      
      // Wait for AI to process and the form to switch to manual edit mode showing the result
      await page.waitForSelector('input[placeholder="Brand (Optional)"]', { timeout: 30000 });
      await page.waitForTimeout(2000); // let state settle
      
      console.log('Clicking Summon button...');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.modal-content button'));
        const summonBtn = btns.find(b => b.textContent.includes('Summon') && !b.textContent.includes('Visions'));
        if (summonBtn) summonBtn.click();
      });
      
      await page.waitForTimeout(3000);
      console.log('Upload workflow complete.');
    } else {
      console.log('No file input found.');
    }
  } catch (e) {
    console.error('Timeout waiting for file input:', e.message);
    const proofDir = '.';
    await page.screenshot({ path: `${proofDir}/batch_upload_timeout.png` });
  }

  const result = await page.evaluate(() => {
    const addBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Add'));
    if (addBtns.length > 0) {
      console.log('Found Add button, clicking it!');
      addBtns[0].click();
      return true;
    }
    return false;
  });
  
  if (result) {
    console.log('Clicked Add! Waiting for save...');
    await page.waitForTimeout(5000);
  } else {
    console.log('No file input found.');
  }
  
  await browser.close();
}

testUpload().catch(console.error);
