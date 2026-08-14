import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.evaluateOnNewDocument(() => {
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'root');
  });

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.btn'));
    const stockBtn = btns.find(b => b.textContent.includes('Stock the Reliquary'));
    if (stockBtn) stockBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.btn.sm'));
    const summonBtn = btns.find(b => b.textContent.includes('Summon by Hand'));
    if (summonBtn) summonBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  
  const textInputs = await page.$$('input[type="text"]');
  if (textInputs.length > 0) {
    // Find the one closest to the end (it's the one in the modal)
    await textInputs[textInputs.length - 1].type('CeraVe Moisturizing Cream');
  }
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.btn'));
    const seekBtn = btns.find(b => b.textContent.includes('Seek in the Codex'));
    if (seekBtn) seekBtn.click();
  });
  
  console.log('Waiting 12s...');
  await new Promise(r => setTimeout(r, 12000));
  await page.screenshot({ path: 'public/assets/avatar-tests/proof_summon_by_hand.png' });

  await browser.close();
  console.log('Done.');
})();
