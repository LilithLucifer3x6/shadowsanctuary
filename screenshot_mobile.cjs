const puppeteer = require('puppeteer');
require('dotenv').config();

const TABS = [
  { id: 'altars', label: 'The Altars', name: 'screenshot_altars' },
  { id: 'rites', label: 'The Mortal Rites', name: 'screenshot_mortal_rites' },
  { id: 'scrying', label: 'Scrying Pool', name: 'screenshot_scrying_pool' },
  { id: 'grimoire', label: 'The Grimoire', name: 'screenshot_grimoire' },
  { id: 'rootwork', label: 'The Rootwork', name: 'screenshot_rootwork' },
  { id: 'shadowtome', label: 'Shadow Tome', name: 'screenshot_shadow_tome' },
  { id: 'visage', label: 'Conjure Visage', name: 'screenshot_conjure_visage' }
];

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Mobile viewport
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('Authenticating Test User...');
  await page.goto('http://localhost:5173');
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.type('#login-email', 'test-automation@shadowsanctuary.local');
  await page.type('#login-password', 'TestPassword123!');
  await page.evaluate(() => {
      const btn = document.querySelector('form button[type="submit"]');
      if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  // Inject state to completely bypass onboarding
  await page.evaluate(() => {
      localStorage.setItem('has_completed_intake', 'true');
      localStorage.setItem('has_viewed_avatar', 'true');
      localStorage.setItem('avatar_config', '{}');
      sessionStorage.setItem('al_currentScreen', 'app');
  });
  
  // Reload to apply flags and force mount of the main app screen
  await page.reload();
  await new Promise(r => setTimeout(r, 3000));
  
  await page.waitForSelector('.tb', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));
  
  const fs = require('fs');
  if (!fs.existsSync('./public/assets/avatar-tests/proofs')) {
    fs.mkdirSync('./public/assets/avatar-tests/proofs', { recursive: true });
  }

  for (const tab of TABS) {
    console.log(`Navigating to ${tab.label}...`);
    await page.evaluate((label) => {
      const tabs = Array.from(document.querySelectorAll('.tb'));
      const t = tabs.find(el => el.title === label || el.textContent.includes(label));
      if (t) t.click();
    }, tab.label);
    
    await new Promise(r => setTimeout(r, 1500));
    const path = `./public/assets/avatar-tests/proofs/mobile_${tab.name}.png`;
    await page.screenshot({ path });
    console.log(`Saved ${path}`);
  }

  await browser.close();
}

run().catch(console.error);
