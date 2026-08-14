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

  // Click Stock the Reliquary
  for (const b of await page.$$('.btn')) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Stock the Reliquary')) { 
       await b.click(); 
       break; 
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  // Click Summon by Hand
  for (const b of await page.$$('.btn.sm')) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text.includes('Summon by Hand')) { 
       await b.click(); 
       break; 
    }
  }
  await new Promise(r => setTimeout(r, 500));
  
  // Type in the VoiceInput text field
  const textInputs = await page.$$('input[type="text"]');
  if (textInputs.length > 0) {
    await textInputs[0].type('CeraVe Moisturizing Cream');
    await new Promise(r => setTimeout(r, 500));
    
    // Click Seek in the Codex
    for (const b of await page.$$('.btn')) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Seek in the Codex')) { 
         await b.click(); 
         break; 
      }
    }
    console.log('Waiting for AI...');
    await new Promise(r => setTimeout(r, 12000));
    await page.screenshot({ path: 'public/assets/avatar-tests/proof_summon_by_hand.png' });
  }

  await browser.close();
  console.log('Done.');
})();
