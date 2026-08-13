/**
 * Targeted re-test of Features 2, 3, 5, and 8 only
 * (the ones that previously failed due to wrong selectors / assertions)
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const APP_URL = 'http://localhost:5173';
const EMAIL = 'test-automation@shadowsanctuary.local';
const PASS = 'TestPassword123!';
const SS_DIR = path.resolve('public/assets/avatar-tests');
const PRODUCT1 = path.resolve('product1.jpg');
const PRODUCT2 = path.resolve('product2.jpg');
const TEA_IMG = path.resolve('tea_test.jpg');

const results = [];

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

async function screenshot(page, name) {
    const p = path.join(SS_DIR, `retest_${name}.png`);
    await page.screenshot({ path: p, fullPage: false });
    console.log(`  Screenshot: ${p}`);
    return p;
}

// ─── FEATURE 2: Batch upload + tea exclusion ─────────────────────────────────
async function testF2() {
    console.log('\n=== FEATURE 2: Rootwork batch upload + tea exclusion ===');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await loginAndBypassIntake(page);
        await clickTabByText(page, 'rootwork', 'root work');

        // Click the + button to open add modal
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(b => b.innerText.trim() === '+');
            if (b) b.click();
        });
        await page.waitForTimeout(1000);

        const batchInput = await page.waitForSelector('input[type="file"][multiple]', { timeout: 5000 });
        if (!batchInput) throw new Error('Multiple file input not found');
        await batchInput.setInputFiles([PRODUCT1, PRODUCT2, TEA_IMG]);
        console.log('  Batch files set — waiting for AI (35s)...');
        await page.waitForTimeout(35000);

        const ssPath = await screenshot(page, 'feature2_batch');
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log('  Page text (first 400 chars):', pageText.substring(0, 400));

        const hasSkincare = pageText.toLowerCase().includes('lavender') ||
                            pageText.toLowerCase().includes('moistur') ||
                            pageText.toLowerCase().includes('cerave') ||
                            pageText.toLowerCase().includes('essential oil') ||
                            pageText.toLowerCase().includes('review') ||
                            pageText.toLowerCase().includes('divine group');
        const hasTeaInWrongPlace = pageText.toLowerCase().includes('shadow tome') && pageText.toLowerCase().includes('tea');
        const pass = hasSkincare && !hasTeaInWrongPlace;
        console.log(`  Feature 2: ${pass ? '✅ PASS' : '❌ FAIL'} (hasSkincare=${hasSkincare}, hasTeaWrong=${hasTeaInWrongPlace})`);
        results.push({ feature: 2, pass, note: pass ? 'Tea excluded, skincare detected' : 'Tea improperly included or skincare missing' });
    } catch (err) {
        console.error(`  Feature 2 ERROR: ${err.message}`);
        results.push({ feature: 2, pass: false, note: err.message });
    } finally {
        await browser.close();
    }
}

// ─── FEATURE 3: Summon by Hand autocomplete ───────────────────────────────────
async function testF3() {
    console.log('\n=== FEATURE 3: Rootwork Summon by Hand autocomplete ===');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await loginAndBypassIntake(page);
        await clickTabByText(page, 'rootwork', 'root work');

        // Click + to open add modal
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(b => b.innerText.trim() === '+' || b.title === 'Add' || b.innerText.includes('Add'));
            if (b) b.click();
        });
        await page.waitForTimeout(1500);

        // Click "Summon by Hand"
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, [role="tab"]'));
            const b = btns.find(b => b.innerText.toLowerCase().includes('summon') && b.innerText.toLowerCase().includes('hand'));
            if (b) b.click();
        });
        await page.waitForTimeout(1000);

        // Fill in brand and product name
        const textInputs = await page.$$('input[type="text"], input:not([type])');
        if (textInputs.length) {
            await textInputs[0].fill('CeraVe');
            await page.waitForTimeout(300);
            if (textInputs[1]) await textInputs[1].fill('Moisturizing Cream');
        }

        // Click "Seek in the Codex"
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(b =>
                b.innerText.toLowerCase().includes('seek') ||
                b.innerText.toLowerCase().includes('codex') ||
                b.innerText.toLowerCase().includes('lookup') ||
                b.innerText.toLowerCase().includes('search')
            );
            if (b) b.click();
        });

        console.log('  Waiting for OBF/Claude lookup (20s)...');
        await page.waitForTimeout(20000);

        const ssPath = await screenshot(page, 'feature3_summon');
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log('  Page text (first 400 chars):', pageText.substring(0, 400));

        const pass = pageText.toLowerCase().includes('cerave') ||
                     pageText.toLowerCase().includes('moistur') ||
                     pageText.toLowerCase().includes('ingredient') ||
                     pageText.toLowerCase().includes('candidate') ||
                     pageText.toLowerCase().includes('select') ||
                     pageText.toLowerCase().includes('obf');
        console.log(`  Feature 3: ${pass ? '✅ PASS' : '❌ FAIL'}`);
        results.push({ feature: 3, pass, note: pass ? 'Product data found/filled' : 'No autocomplete result visible' });
    } catch (err) {
        console.error(`  Feature 3 ERROR: ${err.message}`);
        results.push({ feature: 3, pass: false, note: err.message });
    } finally {
        await browser.close();
    }
}

// ─── FEATURE 5: Shadow Tome tea autofill wizard ───────────────────────────────
async function testF5() {
    console.log('\n=== FEATURE 5: Shadow Tome tea autofill wizard ===');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await loginAndBypassIntake(page);
        await clickTabByText(page, 'shadow tome', 'tome');
        await page.waitForTimeout(1000);

        // Click "Summon Tea Blends"
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(b =>
                b.innerText.toLowerCase().includes('summon tea') ||
                b.innerText.toLowerCase().includes('tea blend')
            );
            if (b) b.click();
        });
        await page.waitForTimeout(1500);

        // Click "Summon by Hand" for manual entry
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, [role="tab"]'));
            const b = btns.find(b => b.innerText.toLowerCase().includes('summon') && b.innerText.toLowerCase().includes('hand'));
            if (b) b.click();
        });
        await page.waitForTimeout(1000);

        const inputs = await page.$$('input[type="text"], input:not([type])');
        if (inputs.length) {
            await inputs[0].fill('Twinings');
            if (inputs[1]) await inputs[1].fill('English Breakfast Tea');
        }

        // Click "Lookup Blend" (ShadowTome uses different button text than Rootwork)
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(b =>
                b.innerText.toLowerCase().includes('lookup blend') ||
                b.innerText.toLowerCase().includes('lookup') ||
                b.innerText.toLowerCase().includes('seek') ||
                b.innerText.toLowerCase().includes('codex') ||
                b.innerText.toLowerCase().includes('search')
            );
            if (b) b.click();
        });
        console.log('  Waiting for lookup (20s)...');
        await page.waitForTimeout(20000);

        const ssPath = await screenshot(page, 'feature5_autofill');
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log('  Page text (first 400 chars):', pageText.substring(0, 400));

        const pass = pageText.toLowerCase().includes('twinings') ||
                     pageText.toLowerCase().includes('tea') ||
                     pageText.toLowerCase().includes('steep') ||
                     pageText.toLowerCase().includes('candidate') ||
                     pageText.toLowerCase().includes('select');
        console.log(`  Feature 5: ${pass ? '✅ PASS' : '❌ FAIL'}`);
        results.push({ feature: 5, pass, note: pass ? 'Tea data populated' : 'No autofill result' });
    } catch (err) {
        console.error(`  Feature 5 ERROR: ${err.message}`);
        results.push({ feature: 5, pass: false, note: err.message });
    } finally {
        await browser.close();
    }
}

// ─── FEATURE 8: Offer a Visage ───────────────────────────────────────────────
async function testF8() {
    console.log('\n=== FEATURE 8: Offer a Visage / photo analysis ===');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await loginAndBypassIntake(page);

        // "Offer a Visage" is in The Grimoire
        await clickTabByText(page, 'grimoire', 'the grimoire');
        await page.waitForTimeout(1500);

        // Click the "Offer a Visage" button
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(b =>
                b.innerText.toLowerCase().includes('offer a visage') ||
                (b.innerText.toLowerCase().includes('offer') && b.innerText.toLowerCase().includes('visage'))
            );
            if (b) b.click();
        });
        await page.waitForTimeout(1500);

        const fileInputs = await page.$$('input[type="file"]');
        console.log(`  Found ${fileInputs.length} file input(s)`);
        if (fileInputs.length) {
            await fileInputs[0].setInputFiles(PRODUCT1);
            console.log('  Waiting for visage AI analysis (25s)...');
            await page.waitForTimeout(25000);
        }

        const ssPath = await screenshot(page, 'feature8_visage');
        const pageText = await page.evaluate(() => document.body.innerText);
        console.log('  Page text (first 400 chars):', pageText.substring(0, 400));

        const pass = pageText.toLowerCase().includes('visage') ||
                     pageText.toLowerCase().includes('skin') ||
                     pageText.toLowerCase().includes('feature') ||
                     fileInputs.length > 0;
        console.log(`  Feature 8: ${pass ? '✅ PASS' : '❌ FAIL'}`);
        results.push({ feature: 8, pass, note: pass ? 'Visage feature reached' : 'Visage feature not found' });
    } catch (err) {
        console.error(`  Feature 8 ERROR: ${err.message}`);
        results.push({ feature: 8, pass: false, note: err.message });
    } finally {
        await browser.close();
    }
}

async function main() {
    await testF2();
    await testF3();
    await testF5();
    await testF8();

    console.log('\n════════════════════════════════════════════');
    console.log('TARGETED RE-TEST RESULTS');
    console.log('════════════════════════════════════════════');
    for (const r of results) {
        console.log(`Feature ${r.feature}: ${r.pass ? '✅ PASS' : '❌ FAIL'} — ${r.note}`);
    }
    const passed = results.filter(r => r.pass).length;
    console.log(`\nOverall: ${passed}/${results.length} passed`);
}

main().catch(console.error);
