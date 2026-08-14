const { chromium } = require('playwright');
const path = require('path');

const APP_URL = 'http://localhost:5173';
const EMAIL = 'test-automation@shadowsanctuary.local';
const PASS = 'TestPassword123!';
const SS_DIR = path.resolve('public/assets/avatar-tests');

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    console.log("Navigating to app...");
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Login
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASS);
    await page.click('#login-submit, button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Setup avatar config
    console.log("Setting up avatar config in localStorage...");
    await page.evaluate(() => {
        localStorage.setItem('intake_completed', 'true');
        const config = {
          name: 'Lilith',
          locStyle: 'Braided Crown',
          robeDesign: 'Forest Green Velvet',
          jewelry: 'Spider Brooch',
          familiar: 'Midnight Cat',
          familiarId: 'cat',
          layers: {
            hair: 'swatch_hair_braids_crown_transparent.png',
            robe: 'swatch_robe_forest_green_velvet_transparent.png',
            jewelry: 'swatch_jewelry_spider_brooch_transparent.png'
          }
        };
        localStorage.setItem('avatar_config', JSON.stringify(config));
    });
    
    // Reload
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Grimoire
    console.log("Navigating to Grimoire...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="tab"], nav a, .tab'));
        const b = btns.find(b => b.textContent && b.textContent.toLowerCase().includes('grimoire'));
        if (b) b.click();
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SS_DIR, 'avatar_in_grimoire.png'), fullPage: false });
    console.log("Screenshot 1 saved: avatar_in_grimoire.png");
    
    // Rootwork
    console.log("Navigating to Rootwork...");
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, [role="tab"], nav a, .tab'));
        const b = btns.find(b => b.textContent && b.textContent.toLowerCase().includes('rootwork'));
        if (b) b.click();
    });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SS_DIR, 'avatar_in_rootwork.png'), fullPage: false });
    console.log("Screenshot 2 saved: avatar_in_rootwork.png");

    await browser.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
