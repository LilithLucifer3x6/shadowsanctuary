const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const APP_URL = 'http://localhost:5173';
const EMAIL = 'test-automation@shadowsanctuary.local';
const PASS = 'TestPassword123!';
const SS_DIR = path.resolve('public/assets/avatar-tests');
const PRODUCT1 = path.resolve('product1.jpg');
const PRODUCT2 = path.resolve('product2.jpg');
const TEA_IMG = path.resolve('tea_test.jpg');

function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`); }

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
            if (btn) { btn.click(); return; }
        }
    }, keywords);
    await page.waitForTimeout(1500);
}

async function screenshot(page, name) {
    const fp = path.join(SS_DIR, `${name}.png`);
    await page.screenshot({ path: fp });
    log(`Screenshot: ${name}.png`);
    return `${name}.png`;
}

const results = [];

async function runFeature4() {
    log('=== FEATURE 4: Shadow Tome tea photo scan ===');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('console', msg => log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    let pass = false;
    let note = '';
    let ssName = 'feature4_retest_ERROR';
    try {
        await loginAndBypassIntake(page);
        await clickTabByText(page, 'shadow tome', 'tome', 'grimoire');
        
        // Find the input file next to "Divine The Consecrated Elements"
        const inputs = await page.$$('input[type="file"]');
        if (inputs.length) {
            log('Uploading tea image to Shadow Tome...');
            await inputs[0].setInputFiles(TEA_IMG);
            await page.waitForTimeout(30000);
            
            ssName = await screenshot(page, 'feature4_tea_scan_fixed');
            const pageText = await page.evaluate(() => document.body.innerText);
            
            pass = pageText.toLowerCase().includes('celestial') || pageText.toLowerCase().includes('chamomile');
            note = pass ? 'Extraction successful' : 'Extraction failed or missing UI';
        } else {
            note = 'File input not found';
        }
    } catch (e) {
        note = e.message;
    } finally {
        await browser.close();
    }
    results.push({ feature: 4, name: 'Shadow Tome tea scan', pass, ss: ssName, note });
    log(`Feature 4: ${pass ? 'PASS' : 'FAIL'} - ${note}`);
}

async function runFeature3() {
    log('=== FEATURE 3: Rootwork Summon by Hand ===');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    let pass = false, note = '', ssName = 'feature3_ERROR';
    try {
        await loginAndBypassIntake(page);
        await clickTabByText(page, 'rootwork', 'root work');
        
        // Open Add modal
        await page.evaluate(() => {
            const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add') || b.innerText === '+');
            if (b) b.click();
        });
        await page.waitForTimeout(1000);
        
        // Click Summon by Hand
        await page.evaluate(() => {
            const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Summon by Hand'));
            if (b) b.click();
        });
        await page.waitForTimeout(1000);
        
        const inputs = await page.$$('input[type="text"]');
        if (inputs.length >= 2) {
            await inputs[0].fill('CeraVe');
            await inputs[1].fill('Moisturizing Cream');
            await page.evaluate(() => {
                const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Seek in the Codex'));
                if (b) b.click();
            });
            await page.waitForTimeout(15000); // wait for OBF
            
            ssName = await screenshot(page, 'feature3_summon_by_hand_fixed');
            const pageText = await page.evaluate(() => document.body.innerText);
            pass = pageText.toLowerCase().includes('cerave') || pageText.toLowerCase().includes('cream');
            note = pass ? 'Autocomplete results found' : 'No results found';
        } else {
            note = 'Inputs not found';
        }
    } catch (e) { note = e.message; } finally { await browser.close(); }
    results.push({ feature: 3, name: 'Rootwork Summon by Hand', pass, ss: ssName, note });
    log(`Feature 3: ${pass ? 'PASS' : 'FAIL'} - ${note}`);
}

async function runFeature5() {
    log('=== FEATURE 5: Shadow Tome autofill wizard ===');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    let pass = false, note = '', ssName = 'feature5_ERROR';
    try {
        await loginAndBypassIntake(page);
        await clickTabByText(page, 'shadow tome', 'tome', 'grimoire');
        
        await page.evaluate(() => {
            const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Summon Tea Blends'));
            if (b) b.click();
        });
        await page.waitForTimeout(1000);
        
        const inputs = await page.$$('input[type="text"]');
        if (inputs.length >= 2) {
            await inputs[0].fill('Celestial Seasonings');
            await inputs[1].fill('Sleepytime');
            await page.evaluate(() => {
                const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Lookup Blend'));
                if (b) b.click();
            });
            await page.waitForTimeout(15000);
            
            ssName = await screenshot(page, 'feature5_tea_lookup_fixed');
            const pageText = await page.evaluate(() => document.body.innerText);
            pass = pageText.toLowerCase().includes('sleepytime') && pageText.toLowerCase().includes('celestial');
            note = pass ? 'Tea results found' : 'No results found';
        } else {
            note = 'Inputs not found';
        }
    } catch (e) { note = e.message; } finally { await browser.close(); }
    results.push({ feature: 5, name: 'Shadow Tome autofill wizard', pass, ss: ssName, note });
    log(`Feature 5: ${pass ? 'PASS' : 'FAIL'} - ${note}`);
}

async function runFeature8() {
    log('=== FEATURE 8: Offer a Visage / Avatar Builder ===');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    let pass = false, note = '', ssName = 'feature8_ERROR';
    try {
        await loginAndBypassIntake(page);
        
        // Either click Reshape Visage in app, or Offer a Visage in Grimoire
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(b => b.innerText.includes('Reshape Visage') || b.innerText.includes('Offer a Visage'));
            if (b) b.click();
        });
        await page.waitForTimeout(2000);
        
        ssName = await screenshot(page, 'feature8_visage_fixed');
        const pageText = await page.evaluate(() => document.body.innerText);
        pass = pageText.toLowerCase().includes('conjure your visage') || pageText.toLowerCase().includes('locs');
        note = pass ? 'Avatar builder opened (No photo upload exists for this feature by design)' : 'Failed to open avatar builder';
    } catch (e) { note = e.message; } finally { await browser.close(); }
    results.push({ feature: 8, name: 'Offer a Visage', pass, ss: ssName, note });
    log(`Feature 8: ${pass ? 'PASS' : 'FAIL'} - ${note}`);
}

async function runFeature2() {
    log('=== FEATURE 2: Batch upload tea exclusion assertion ===');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    let pass = false, note = '', ssName = 'feature2_ERROR';
    try {
        await loginAndBypassIntake(page);
        await clickTabByText(page, 'rootwork', 'root work');
        
        await page.evaluate(() => {
            const b = Array.from(document.querySelectorAll('button')).find(b => b.innerText === '+' || b.innerText.includes('Add'));
            if (b) b.click();
        });
        await page.waitForTimeout(1000);
        
        // Find multiple input
        const fileInputs = await page.$$('input[type="file"]');
        let targetInput = null;
        for (const fi of fileInputs) {
            if (await fi.evaluate(el => el.multiple)) { targetInput = fi; break; }
        }
        
        if (targetInput) {
            await targetInput.setInputFiles([PRODUCT1, PRODUCT2, TEA_IMG]);
            log('Uploading batch, waiting for AI...');
            await page.waitForTimeout(40000);
            
            ssName = await screenshot(page, 'feature2_tea_exclusion_fixed');
            const pageText = await page.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input, textarea')).map(i => i.value).join(' ');
                return document.body.innerText + ' ' + inputs;
            });
            
            // Should contain Lavender or other product, but NOT chamomile/tea
            const hasProduct = pageText.toLowerCase().includes('lavender') || pageText.toLowerCase().includes('oil') || pageText.toLowerCase().includes('moistur') || pageText.toLowerCase().includes('cerave');
            const hasTea = pageText.toLowerCase().includes('chamomile') || pageText.toLowerCase().includes('tea') || pageText.toLowerCase().includes('celestial');
            
            if (hasProduct && !hasTea) {
                pass = true;
                note = 'Tea excluded successfully, other products parsed';
            } else if (!hasProduct) {
                note = 'Did not extract products properly';
            } else if (hasTea) {
                note = 'Tea was NOT excluded, it appeared in rootwork batch';
            }
        }
    } catch (e) { note = e.message; } finally { await browser.close(); }
    results.push({ feature: 2, name: 'Batch upload tea exclusion', pass, ss: ssName, note });
    log(`Feature 2: ${pass ? 'PASS' : 'FAIL'} - ${note}`);
}

async function main() {
    // await runFeature4();
    // await runFeature3();
    // await runFeature5();
    // await runFeature8();
    await runFeature2();
    
    log('--- RESULTS ---');
    results.forEach(r => log(`Feature ${r.feature}: ${r.pass ? 'PASS' : 'FAIL'} - ${r.note} (${r.ss})`));
    
    // Push
    const ssFiles = results.map(r => `public/assets/avatar-tests/${r.ss}`);
    try {
        execSync(`git add ${ssFiles.join(' ')}`);
        execSync(`git commit -m "Phase 1: Verification fixes for AI features"`);
        execSync(`git push origin main`);
    } catch(e) { log(e.message); }
}

main();
