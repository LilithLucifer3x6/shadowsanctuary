import puppeteer from 'puppeteer';
import fs from 'fs';

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

  // ROOTWORK - BATCH UPLOAD
  const btns = await page.$$('.btn');
  for (const b of btns) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Stock the Reliquary')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  const inputs = await page.$$('input[type="file"]');
  let fileUploaded = false;
  for (const input of inputs) {
    const isMultiple = await page.evaluate(el => el.multiple, input);
    if (isMultiple) {
      await input.uploadFile('real_product.jpg');
      fileUploaded = true;
      break;
    }
  }
  if (!fileUploaded && inputs.length > 0) {
     await inputs[inputs.length - 1].uploadFile('real_product.jpg');
  }

  await new Promise(r => setTimeout(r, 12000)); 
  await page.screenshot({ path: 'public/assets/avatar-tests/proof_batch_upload.png' });
  
  await page.evaluate(() => {
    const closeBtns = document.querySelectorAll('.btn.icon');
    if (closeBtns.length > 0) closeBtns[0].click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // ROOTWORK - SUMMON BY HAND
  for (const b of await page.$$('.btn')) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Stock the Reliquary')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  for (const b of await page.$$('.btn.sm')) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Summon by Hand')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 500));
  
  const textInputs = await page.$$('input[type="text"]');
  if (textInputs.length > 0) {
    await textInputs[0].type('CeraVe Moisturizing Cream');
    await new Promise(r => setTimeout(r, 500));
    for (const b of await page.$$('.btn')) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Summon Details')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 12000));
    await page.screenshot({ path: 'public/assets/avatar-tests/proof_summon_by_hand.png' });
  }

  // SHADOW TOME - TEA AUTOCONFIG
  await page.evaluate(() => {
    sessionStorage.setItem('al_activeTab', 'tome');
    const tabs = document.querySelectorAll('.tb');
    if (tabs.length > 5) tabs[5].click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  for (const b of await page.$$('.btn')) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Add to Codex')) { await b.click(); break; }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  const tomeInputs = await page.$$('input[type="text"]');
  if (tomeInputs.length > 0) {
    await tomeInputs[0].type('Sleepytime Tea');
    await new Promise(r => setTimeout(r, 500));
    for (const b of await page.$$('.btn')) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Seek in the Codex')) { await b.click(); break; }
    }
    await new Promise(r => setTimeout(r, 12000));
    await page.screenshot({ path: 'public/assets/avatar-tests/proof_tea_autofill.png' });
  }

  await browser.close();
  console.log('Live UI verification screenshots taken!');
})();
