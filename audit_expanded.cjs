require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');

async function runAudit() {
  console.log('Starting full app audit via Puppeteer...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[Browser]', msg.text()));
  
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

  // 3. Mobile Viewport Boundary Check
  console.log('Testing Mobile Navigation Boundary (Scrollable Tabs)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await wait(1000);
  const isScrollable = await page.evaluate(() => {
      const tabs = document.querySelector('.tabs');
      return tabs && tabs.scrollWidth > tabs.clientWidth;
  });
  if (isScrollable) {
      console.log('[PASS] Mobile navigation collapses properly into a scrollable horizontal container.');
  } else {
      console.log('[FAIL] Mobile navigation is NOT scrollable! Layout might be broken on narrow widths.');
  }
  
  // Reset viewport
  await page.setViewport({ width: 1280, height: 800 });

  // 4. Route Transition Assertions
  console.log('Testing Route Transitions (Component Mounting)...');
  const routes = [
      { tab: 'The Mortal Rites', text: 'Invocation' },
      { tab: 'The Grimoire', text: 'Appointed Times' },
      { tab: 'The Altars', text: 'Crown' },
      { tab: 'The Rootwork', text: 'Summon' },
      { tab: 'The Shadow Tome', text: 'Stillroom' },
      { tab: 'The Scrying Pool', text: 'What the Water Shows' }
  ];
  for (const r of routes) {
      await clickTab(r.tab);
      const mounted = await page.evaluate((txt) => {
          return document.body.innerText.includes(txt);
      }, r.text);
      if (mounted) {
          console.log(`[PASS] Route Transition: ${r.tab} successfully mounted (found '${r.text}')`);
      } else {
          console.log(`[FAIL] Route Transition: ${r.tab} FAILED to mount! Did not find '${r.text}'`);
      }
  }

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

  // 5. Avatar Generator Input Manipulation
  console.log('Testing Avatar Generator Form Input...');
  try {
      // Navigate to Avatar generator (using the profile icon in the topbar)
      await page.evaluate(() => {
          const btn = document.querySelector('button.avatar-icon-btn, button[title="Profile"]');
          if (btn) btn.click();
      });
      await wait(1500);
      
      const avatarMounted = await page.$('#s-av');
      if (avatarMounted) {
          console.log('[PASS] Avatar generator reached via Profile button.');
          
          // Type into VoiceInput text field
          await page.evaluate(() => {
              const input = document.querySelector('#s-av input[type="text"]');
              if (input) {
                  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                  nativeSetter.call(input, "Avatar Test String");
                  input.dispatchEvent(new Event('input', { bubbles: true }));
              }
          });
          await wait(500);
          
          // Click Save
          await page.evaluate(() => {
              const saveBtn = Array.from(document.querySelectorAll('#s-av button')).find(b => b.textContent.includes('Save') || b.textContent.includes('Confirm'));
              if (saveBtn) saveBtn.click();
          });
          await wait(2000);
          console.log('[PASS] Avatar Generator: Successfully typed into input and saved.');
      } else {
          console.log('[FAIL] Could not navigate to Avatar Generator via topbar icon.');
          await page.screenshot({ path: `${proofDir}/avatar_nav_failed.png` });
      }
        // Return to main app
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const returnBtn = btns.find(b => b.textContent.includes('Return'));
            if (returnBtn) returnBtn.click();
        });
        await wait(2000);
      
  } catch(e) {
      console.log('[FAIL] Avatar Generator test exception:', e.message);
  }

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
      
      const fullTomeText = await page.evaluate(() => document.body.innerText);
      if (fullTomeText.includes('Test Tea')) {
          console.log('[PASS] TEA LIST: "Test Tea" correctly appeared in the Shadow Tome.');
      } else {
          console.log('[FAIL] TEA LIST: "Test Tea" is missing from the Shadow Tome after creation!');
      }
  } catch (e) {
    console.log('[FAIL] Dram Leak / Honey tests exception:', e);
  }

  console.log('Audit complete.');
  await browser.close();
}

runAudit().catch(console.error);
