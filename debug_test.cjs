const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_URL = 'http://localhost:5173';
const EMAIL = 'test-automation@shadowsanctuary.local';
const PASS = 'TestPassword123!';
const TEA_IMG = path.resolve('tea_test.jpg');

async function debug() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    await page.evaluate(() => {
        localStorage.setItem('intake_completed', 'true');
        localStorage.setItem('avatar_config', JSON.stringify({ hairstyle: 'locs', robe: 'charcoal' }));
    });
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // FEATURE 4
    await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('button, [role="tab"], nav a, .tab'));
        const t = tabs.find(el => el.textContent && el.textContent.toLowerCase().includes('shadow tome'));
        if (t) t.click();
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'public/assets/avatar-tests/debug1_shadow_tome.png' });
    
    const inputInfo = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('input[type="file"]')).map(el => ({
            id: el.id,
            className: el.className,
            name: el.name,
            parentElementHtml: el.parentElement.outerHTML.substring(0, 200)
        }));
    });
    console.log("File inputs found:", JSON.stringify(inputInfo, null, 2));

    const inputs = await page.$$('input[type="file"]');
    if (inputs.length) {
        console.log("Uploading image...");
        await inputs[0].setInputFiles(TEA_IMG);
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'public/assets/avatar-tests/debug2_after_upload_5s.png' });
        await page.waitForTimeout(25000);
        await page.screenshot({ path: 'public/assets/avatar-tests/debug3_after_upload_30s.png' });
    }

    // FEATURE 5
    await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Summon Tea Blends'));
        if (b) b.click();
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'public/assets/avatar-tests/debug4_after_summon_tea_click.png' });

    // FEATURE 8
    await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Reshape Visage') || b.innerText.includes('Offer a Visage'));
        if (b) b.click();
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'public/assets/avatar-tests/debug5_after_reshape_visage.png' });

    await browser.close();
}

debug().catch(console.error);
