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

  // ROOTWORK - SUMMON BY HAND
  let clicked = false;
  for (const b of await page.$$('.btn')) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Stock the Reliquary')) { 
       await b.click(); 
       clicked = true;
       break; 
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  if (clicked) {
    for (const b of await page.$$('.btn.sm')) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Summon by Hand')) { 
         await b.click(); 
         break; 
      }
    }
    await new Promise(r => setTimeout(r, 500));
    
    const textareas = await page.$$('textarea');
    if (textareas.length > 0) {
      await textareas[0].type('CeraVe Moisturizing Cream');
      await new Promise(r => setTimeout(r, 500));
      for (const b of await page.$$('.btn')) {
        const text = await page.evaluate(el => el.textContent, b);
        if (text.includes('Seek in the Codex')) { 
           await b.click(); 
           break; 
        }
      }
      console.log('Waiting for AI candidates...');
      await new Promise(r => setTimeout(r, 12000));
      await page.screenshot({ path: 'public/assets/avatar-tests/proof_summon_by_hand.png' });
    }
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
  
  const textareas2 = await page.$$('textarea');
  // It's possible the Tome modal doesn't use textarea. Let's type in input type text just in case.
  const tomeInputs = await page.$$('input[type="text"]');
  if (tomeInputs.length > 0) {
    await tomeInputs[0].type('Sleepytime Tea');
  } else if (textareas2.length > 0) {
    await textareas2[0].type('Sleepytime Tea');
  }

  await new Promise(r => setTimeout(r, 500));
  for (const b of await page.$$('.btn')) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Seek in the Codex')) { await b.click(); break; }
  }
  console.log('Waiting for Tome AI...');
  await new Promise(r => setTimeout(r, 12000));
  await page.screenshot({ path: 'public/assets/avatar-tests/proof_tea_autofill.png' });

  await browser.close();
  console.log('Summon tests done.');
})();
