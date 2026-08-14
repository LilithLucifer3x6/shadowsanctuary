require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

async function runAudit() {
  console.log('Starting full app audit via Puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.toString()}`);
  });

  page.on('response', response => {
    if (!response.ok()) {
      console.log(`[NETWORK ERROR] ${response.status()} ${response.url()}`);
    }
  });
  
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  const clickTab = async (label) => {
      await page.evaluate((lbl) => {
          const btn = Array.from(document.querySelectorAll('.tb')).find(b => b.innerText.includes(lbl));
          if (btn) btn.click();
      }, label);
      await wait(2000);
  };
  
  // Set up proof folder
  const proofDir = 'public/assets/avatar-tests/proofs';
  if (!fs.existsSync(proofDir)){
      fs.mkdirSync(proofDir, { recursive: true });
  }

  // 1. Landing Page - Desktop and Mobile Widths
  console.log('Testing Landing Page Responsive Title...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/');
  await wait(2000);
  
  // Login first to authenticate the browser session
  console.log('Authenticating Test User...');
  const emailInput = await page.$('#login-email');
  if (emailInput) {
      await page.type('#login-email', 'test-automation@shadowsanctuary.local');
      await page.type('#login-password', 'TestPassword123!');
      await page.evaluate(() => {
          const btn = document.querySelector('form button[type="submit"]');
          if (btn) btn.click();
      });
      await wait(3000); // Wait for auth to process and redirect
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
  await wait(2000);

  await page.screenshot({ path: `${proofDir}/landing_desktop.png` });
  
  await page.setViewport({ width: 375, height: 812 });
  await wait(1000);
  await page.screenshot({ path: `${proofDir}/landing_mobile.png` });

  // Reset viewport
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Checking navigation...');
  try {
    const skipBtn = await page.$('::-p-text(Skip Login)') || await page.$('::-p-text(Enter Without Account)');
    if (skipBtn) await skipBtn.click();
    await wait(2000);
  } catch (e) {
    console.log('No skip button found, proceeding as is...');
  }

  // Navigate  // 3. Grimoire UI Spacing
  console.log('Testing Grimoire Layout...');
  await clickTab('The Grimoire');
  await page.screenshot({ path: `${proofDir}/grimoire_spacing.png` });

  // Test Modal Vertical Centering (e.g. Settings or Alchemy)
  console.log('Testing Modal Centering...');
  try {
     const settingsBtn = await page.$('.settings-btn') || await page.$('button[title="Settings"]') || await page.$('::-p-text(Settings)') || await page.$('::-p-text(Alchemy)');
     if (settingsBtn) {
       await settingsBtn.click();
       await wait(1000);
       await page.screenshot({ path: `${proofDir}/modal_centering.png` });
       // Close modal
       await page.keyboard.press('Escape');
       await wait(500);
     }
  } catch (e) { console.log('Could not open a modal', e); }

  // Scrying Pool
  console.log('Testing Scrying Pool Zones...');
  await clickTab('The Scrying Pool');
  await page.screenshot({ path: `${proofDir}/scrying_zones.png` });
  
  // Commune Button test
  console.log('Testing Commune Button Responsiveness (5 clicks)...');
  try {
    for (let i = 0; i < 5; i++) {
        const communeBtn = await page.$('button.commune') || await page.$('::-p-text(Commune)');
        if (communeBtn) {
            await communeBtn.click();
            await wait(500);
        }
    }
    await page.screenshot({ path: `${proofDir}/commune_test.png` });
  } catch (e) { console.log('Commune button not found', e); }

  console.log('=== STATE-BASED AUDIT CHECKS ===');

  // 1. DOSE ACCUMULATION (Took Xmg)
  console.log('Testing Dose Accumulation (Isotretinoin) - preventing duplicate entries for same day...');
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    await clickTab('The Mortal Rites');
    
    // Click "Took Xmg" twice rapidly to test race condition / accumulation logic
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.btn.plum'));
        const tookBtn = btns.find(b => b.textContent.includes('Took'));
        if (tookBtn) {
            tookBtn.click();
            tookBtn.click();
        }
    });
    await wait(2000); // Wait for both requests to settle

    const supaUrl = process.env.VITE_SUPABASE_URL;
    const supaAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    const recordsFound = await page.evaluate(async (today, url, anonKey) => {
        const token = localStorage.getItem('sb-gwezojwujynharoqjuio-auth-token');
        if (!token) return 0;
        const session = JSON.parse(token);
        const res = await fetch(`${url}/rest/v1/isotretinoin_log?last_confirmed_date=eq.${today}&select=id`, {
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${session.access_token}`
            }
        });
        const text = await res.text();
        console.log("Dose Accumulation Fetch Response:", text);
        try {
            const data = JSON.parse(text);
            return data ? data.length : 0;
        } catch(e) {
            return 0;
        }
    }, todayStr, supaUrl, supaAnonKey);
    
    if (recordsFound > 1) {
        console.log(`[FAIL] DOSE ACCUMULATION BUG: Found ${recordsFound} rows for ${todayStr}. Upsert failed or duplicated!`);
    } else if (recordsFound === 1) {
        console.log(`[PASS] Dose Accumulation: Exactly 1 record found for today. No duplication leak.`);
    } else {
        console.log(`[FAIL] Dose Accumulation: 0 records found. The button click failed to insert/upsert.`);
    }
  } catch (e) {
    console.log('[FAIL] Dose Accumulation script error:', e.message);
  }

  // 2. STILLROOM / HONEY / TEA / DRAM LEAK
  console.log('Testing Dram/Reliquary Leak and Stillroom presentation...');
  try {
    // Navigate to ShadowTome to add Tea
    await clickTab('The Shadow Tome');
    // Click "Seek in the Codex"
    const seekBtn = await page.$('::-p-text(Seek in the Codex)');
    if (seekBtn) {
        await seekBtn.click();
        await wait(1000);
        
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('.modal-content input[type="text"]');
            if (inputs.length > 1) {
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                nativeSetter.call(inputs[0], "Test Brand");
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                nativeSetter.call(inputs[1], "Test Tea");
                inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await wait(500);
        
        const seekInside = await page.$('button.btn.plum'); // Seek in the Codex inside modal
        if (seekInside) {
            await seekInside.click();
            await wait(2000); // Wait for Open Food Facts or fallback
        }
        
        const fallbackBtn = await page.$('::-p-text(No Match)');
        if (fallbackBtn) {
            await fallbackBtn.click();
            await wait(1000);
        }
        
        const saveBtn = await page.$('::-p-text(Save to Herbarium)');
        if (saveBtn) {
            await saveBtn.click();
            await wait(2000); // Wait for Supabase save
        }
    }

    // Navigate to Rootwork
    await clickTab('The Rootwork');
    await wait(1000);
    
    // Click the manual add button (+)
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const plusBtn = btns.find(b => b.textContent.trim() === '+');
        if (plusBtn) plusBtn.click();
    });
    await wait(2000);
    
    // Click Summon by Hand
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const manualBtn = btns.find(b => b.textContent.includes('Summon by Hand'));
        if (manualBtn) manualBtn.click();
    });
    await wait(1500);

    // Fill Seed Step
    await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        if (inputs.length > 0) {
            const input = inputs[0];
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            nativeInputValueSetter.call(input, "Test Raw Honey");
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    await wait(1000);
    
    // Click Next
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const nextBtn = btns.find(b => b.textContent.includes('Next') || b.textContent.includes('Continue'));
        if (nextBtn) nextBtn.click();
    });
    await wait(4000); // Wait for the "Codex search" simulation to complete
    
    // The Confirm Step is now active
    // The mock AI should have filled it, but we select a category tag just in case
    await page.evaluate(() => {
        const tag = document.querySelector('.tag');
        if (tag) tag.click(); // Select first category tag if present
    });
    await wait(1000);

    // Click Summon (Confirm step)
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        // Find Summon but NOT Summon by Hand or other specific buttons
        const summonBtn = btns.reverse().find(b => b.textContent.includes('Summon') && !b.textContent.includes('Summon by Hand') && !b.textContent.includes('Multiple') && !b.textContent.includes('Scroll'));
        if (summonBtn) summonBtn.click();
    });
    await wait(4000); // Wait for save to DB and modal to close
    
    await page.screenshot({ path: `${proofDir}/debug_rootwork_after_summon.png` });

    // Check Rites (Dram should NOT be there)
    await clickTab('The Mortal Rites');
    const ritesText = await page.evaluate(() => document.body.innerText);
    if (ritesText.includes('Test Raw Honey')) {
        console.log('[FAIL] DRAM LEAK: "Test Raw Honey" appeared in The Mortal Rites!');
    } else {
        console.log('[PASS] No Dram Leak into The Mortal Rites.');
    }

    // Check Shadow Tome (Tea SHOULD be there, Honey SHOULD NOT)
    await clickTab('The Shadow Tome');
    const tomeText = await page.evaluate(() => {
        // Find the stillroom column
        const headers = Array.from(document.querySelectorAll('h3'));
        const stillroomHeader = headers.find(h => h.textContent.includes('The Stillroom'));
        if (stillroomHeader && stillroomHeader.parentElement) {
            return stillroomHeader.parentElement.innerText;
        }
        return '';
    });
    
    if (tomeText.includes('Test Raw Honey')) {
        console.log('[PASS] STILLROOM HONEY: Honey correctly appeared in the Stillroom list.');
    } else {
        console.log('[FAIL] STILLROOM HONEY: "Test Raw Honey" is missing from the Stillroom list!');
    }
  } catch (e) { console.log('[FAIL] Dram Leak / Honey tests exception:', e); }

  console.log('Audit complete.');
  await browser.close();
}

runAudit().catch(console.error);
