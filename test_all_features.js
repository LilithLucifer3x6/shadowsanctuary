import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
    localStorage.setItem('avatar_config', JSON.stringify({ pose: 'working' }));
    localStorage.setItem('intake_completed', 'true');
    sessionStorage.setItem('al_currentScreen', 'app');
    sessionStorage.setItem('al_activeTab', 'root');
  });
  
  await page.reload();
  await new Promise(r => setTimeout(r, 2000));

  const waitForEl = async (selector, timeout = 10000) => {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (e) {
      console.error(`FAILED: Expected element "${selector}" not found on page!`);
      await page.screenshot({ path: `public/assets/avatar-tests/ERROR_${selector.replace(/[^a-zA-Z]/g, '')}.png` });
      process.exit(1);
    }
  };

  const getBtnByText = async (textSubstring) => {
    const btns = await page.$$('button');
    for (const b of btns) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes(textSubstring)) return b;
    }
    return null;
  };

  const clickExactBtn = async (textExact) => {
    const btns = await page.$$('button');
    for (const b of btns) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.trim() === textExact) {
        await b.click();
        return true;
      }
    }
    return false;
  };

  console.log('Waiting for app to load...');
  await new Promise(r => setTimeout(r, 2000));

  console.log('--- ROOTWORK BATCH UPLOAD ---');
  let rootworkTabBtn = await getBtnByText('The Rootwork');
  if (rootworkTabBtn) await rootworkTabBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  let clickedPlus = await clickExactBtn('+');
  if (!clickedPlus) { console.error('FAILED: + button missing.'); process.exit(1); }
  
  await new Promise(r => setTimeout(r, 1000));
  await waitForEl('input[type="file"]');
  
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

  console.log('Waiting for AI batch proxy extraction...');
  await new Promise(r => setTimeout(r, 12000)); 
  await page.screenshot({ path: 'public/assets/avatar-tests/proof_batch_upload.png' });
  
  // Reload page to reliably clear all modals
  await page.reload();
  await new Promise(r => setTimeout(r, 2000));

  console.log('--- ROOTWORK SUMMON BY HAND ---');
  rootworkTabBtn = await getBtnByText('The Rootwork');
  if (rootworkTabBtn) await rootworkTabBtn.click();
  await new Promise(r => setTimeout(r, 1000));

  await clickExactBtn('+');
  await new Promise(r => setTimeout(r, 1000));
  
  let summonBtn = await getBtnByText('Summon by Hand');
  if (!summonBtn) { console.error('FAILED: Summon by Hand button missing.'); process.exit(1); }
  await summonBtn.click();
  await new Promise(r => setTimeout(r, 1000));
  
  await waitForEl('input[type="text"]');
  const textInputs = await page.$$('input[type="text"]');
  await textInputs[textInputs.length - 1].type('CeraVe Moisturizing Cream');
  await new Promise(r => setTimeout(r, 500));
  
  const seekBtn = await getBtnByText('Seek in the Codex');
  if (!seekBtn) { console.error('FAILED: Seek in the Codex button missing for Summon.'); process.exit(1); }
  await seekBtn.click();
  
  console.log('Waiting for AI candidate search...');
  await new Promise(r => setTimeout(r, 12000));
  await page.screenshot({ path: 'public/assets/avatar-tests/proof_summon_by_hand.png' });

  // Reload page to reliably clear all modals
  await page.reload();
  await new Promise(r => setTimeout(r, 2000));

  // SHADOW TOME
  console.log('--- SHADOW TOME (STILLROOM + TEA AUTOFILL + ALCHEMY) ---');
  let tomeTabBtn = await getBtnByText('The Shadow Tome');
  if (tomeTabBtn) await tomeTabBtn.click();
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Screenshotting Stillroom...');
  await page.screenshot({ path: 'public/assets/avatar-tests/stillroom_proof.png' });
  
  const addTeaBtn = await getBtnByText('Summon Tea Blends');
  if (!addTeaBtn) { console.error('FAILED: Summon Tea Blends button missing in Tome.'); process.exit(1); }
  await addTeaBtn.click();
  await new Promise(r => setTimeout(r, 1000));
  
  await waitForEl('input[type="text"]');
  const tomeInputs = await page.$$('input[type="text"]');
  await tomeInputs[tomeInputs.length - 1].type('Sleepytime Tea');
  await new Promise(r => setTimeout(r, 500));
  
  const seekTomeBtn = await getBtnByText('Lookup Blend');
  if (!seekTomeBtn) { console.error('FAILED: Lookup Blend button missing in Tome.'); process.exit(1); }
  await seekTomeBtn.click();
  
  console.log('Waiting for Tome AI autofill...');
  await new Promise(r => setTimeout(r, 12000));
  await page.screenshot({ path: 'public/assets/avatar-tests/proof_tea_autofill.png' });

  // Reload page to reliably clear all modals
  await page.reload();
  await new Promise(r => setTimeout(r, 2000));

  console.log('--- ALCHEMY MODAL ---');
  tomeTabBtn = await getBtnByText('The Shadow Tome');
  if (tomeTabBtn) await tomeTabBtn.click();
  await new Promise(r => setTimeout(r, 2000));
  
  const craftBtn = await getBtnByText('Ignite New Alchemy');
  if (craftBtn) {
    await craftBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'public/assets/avatar-tests/alchemy_modal_proof.png' });
  } else {
    console.error('FAILED: Ignite New Alchemy missing.');
    process.exit(1);
  }

  await browser.close();
  console.log('ALL Live UI verifications PASSED and screenshots taken!');
})();
