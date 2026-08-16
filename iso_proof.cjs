const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1080 });

  try {
    await page.goto('http://localhost:5173/?bypass=true', { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.fonts.ready);
    
    // Go to rites
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('*')).find(e => e.textContent.includes('Mortal Rites'));
      if (el) el.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Wait until 'Took' or 'Undo' button appears
    await page.waitForSelector('.btn');
    
    // Check what is there
    let html = await page.content();
    require('fs').writeFileSync('docs/proofs/iso-debug.html', html);

    const takenBtn = await page.$('button::-p-text(Took)');
    if (takenBtn) {
      await takenBtn.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: 'docs/proofs/p1-iso-taken.png' });
      
      const undoBtn = await page.$('button::-p-text(Undo)');
      if (undoBtn) {
        await undoBtn.click();
        await new Promise(r => setTimeout(r, 1000));
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: 'docs/proofs/p1-iso-undone.png' });
      }
    } else {
      const undoBtn = await page.$('button::-p-text(Undo)');
      if (undoBtn) {
        await undoBtn.click();
        await new Promise(r => setTimeout(r, 1000));
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: 'docs/proofs/p1-iso-undone.png' });
        
        const takenBtn2 = await page.$('button::-p-text(Took)');
        if (takenBtn2) {
          await takenBtn2.click();
          await new Promise(r => setTimeout(r, 1000));
          await page.evaluate(() => document.fonts.ready);
          await page.screenshot({ path: 'docs/proofs/p1-iso-taken.png' });
        }
      }
    }
  } finally {
    await browser.close();
    try { await require('./test_teardown.cjs')(); } catch (e) {}
  }
})();

