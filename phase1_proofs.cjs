const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1080 });

  try {
    console.log("Navigating to auth screen...");
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    
    // Check if login is present
    const isLogin = await page.$('#login-email');
    if (isLogin) {
      console.log("Logging in as test@example.com...");
      await page.type('#login-email', 'test@example.com');
      await page.type('#login-password', 'testpassword123');
      await page.click('#login-submit');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    // Wait for fonts
    await page.evaluate(() => document.fonts.ready);
    
    console.log("--- PROOF: Isotretinoin Undo ---");
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('button')).find(e => e.textContent.includes('Mortal Rites'));
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    let btnTook = await page.$('button::-p-text(Took)');
    if (btnTook) {
      await btnTook.click();
      await new Promise(r => setTimeout(r, 500));
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: 'docs/proofs/p1-isotretinoin-taken.png', fullPage: true });
      
      const btnUndo = await page.$('button::-p-text(Undo)');
      if (btnUndo) {
        await btnUndo.click();
        await new Promise(r => setTimeout(r, 500));
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: 'docs/proofs/p1-isotretinoin-undone.png', fullPage: true });
      }
    } else {
      console.log("Could not find 'Took' button. Maybe already taken?");
      const btnUndo = await page.$('button::-p-text(Undo)');
      if (btnUndo) {
        await btnUndo.click();
        await new Promise(r => setTimeout(r, 500));
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: 'docs/proofs/p1-isotretinoin-undone.png', fullPage: true });
        
        const btnTook2 = await page.$('button::-p-text(Took)');
        if (btnTook2) {
          await btnTook2.click();
          await new Promise(r => setTimeout(r, 500));
          await page.screenshot({ path: 'docs/proofs/p1-isotretinoin-taken.png', fullPage: true });
        }
      }
    }
    
    console.log("--- PROOF: Shadow Tome Batch & Disabled Button ---");
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('button')).find(e => e.textContent.includes('Shadow Tome'));
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/proofs/p1-shadowtome-disabled.png', fullPage: true });
    
    const fileInputs = await page.$$('input[type="file"][multiple]');
    if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile('dummy.png');
      await new Promise(r => setTimeout(r, 2000));
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: 'docs/proofs/p1-shadowtome-upload.png', fullPage: true });
    }
    
    console.log("--- PROOF: Echo Batch Upload ---");
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('button')).find(e => e.textContent.includes('Rootwork'));
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    const rootworkInputs = await page.$$('input[type="file"][multiple]');
    if (rootworkInputs.length > 0) {
      await rootworkInputs[0].uploadFile('dummy.png');
      await new Promise(r => setTimeout(r, 2000));
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: 'docs/proofs/p1-echo-upload.png', fullPage: true });
    }

    console.log("All proofs generated.");
  } catch (err) {
    console.error("Error generating proofs:", err);
  } finally {
    await browser.close();
    try { await require('./test_teardown.cjs')(); } catch (e) {}
  }
})();

