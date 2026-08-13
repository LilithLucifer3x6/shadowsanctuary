const { chromium } = require('playwright');
const path = require('path');

const APP_URL = 'http://localhost:5173';
const EMAIL = 'test-automation@shadowsanctuary.local';
const PASS = 'TestPassword123!';
const SS_DIR = path.resolve('public/assets/avatar-tests');
const PRODUCT1 = path.resolve('product1.jpg');
const PRODUCT2 = path.resolve('product2.jpg');
const TEA_IMG = path.resolve('tea_test.jpg');

async function loginAndBypassIntake(page) {
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    const emailInput = await page.$('input[type="email"]');
    const passInput = await page.$('input[type="password"]');
    if (!emailInput || !passInput) throw new Error('Login form not found');
    await emailInput.fill(EMAIL);
    await passInput.fill(PASS);

    const submitBtn = await page.$('#login-submit, button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    else await page.keyboard.press('Enter');

    await page.waitForTimeout(4000);

    await page.evaluate(() => {
        localStorage.setItem('intake_completed', 'true');
        localStorage.setItem('avatar_config', JSON.stringify({ hairstyle: 'locs', robe: 'charcoal' }));
    });
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
}

async function clickTabByText(page, ...keywords) {
    await page.evaluate((kws) => {
        const all = Array.from(document.querySelectorAll('button, [role="tab"], nav a, .tab'));
        for (const kw of kws) {
            const btn = all.find(el => el.textContent && el.textContent.trim().toLowerCase().includes(kw.toLowerCase()));
            if (btn) { btn.click(); return true; }
        }
        return false;
    }, keywords);
    await page.waitForTimeout(1500);
}

async function testFeature2() {
    console.log('=== FEATURE 2: Rootwork batch upload + tea exclusion ===');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await loginAndBypassIntake(page);
        await clickTabByText(page, 'rootwork', 'root work');

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(b => b.innerText.trim() === '+');
            if (b) b.click();
        });
        await page.waitForTimeout(1000);

        const batchInput = await page.waitForSelector('input[type="file"][multiple]', { timeout: 5000 });
        if (!batchInput) throw new Error('Multiple file input not found');
        
        await batchInput.setInputFiles([PRODUCT1, PRODUCT2, TEA_IMG]);
        console.log('Batch files set — waiting for AI...');
        await page.waitForTimeout(35000);

        const ssName = path.join(SS_DIR, `verify_feature2_rootwork_batch.png`);
        await page.screenshot({ path: ssName, fullPage: false });
        console.log(`Screenshot saved: ${ssName}`);

        const pageText = await page.evaluate(() => document.body.innerText);
        console.log("Page text snippet:", pageText.substring(0, 500));
        
        const hasBatch = pageText.toLowerCase().includes('lavender') && !pageText.toLowerCase().includes('tea') && !pageText.toLowerCase().includes('chamomile');
        console.log(`Feature 2: ${hasBatch ? 'PASS' : 'FAIL'} (Text logic matched: ${hasBatch})`);
    } catch (err) {
        console.error(`Feature 2 ERROR: ${err.message}`);
    } finally {
        await browser.close();
    }
}

testFeature2().catch(console.error);
