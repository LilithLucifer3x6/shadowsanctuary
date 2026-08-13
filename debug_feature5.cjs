const { chromium } = require('playwright');
const path = require('path');

const APP_URL = 'http://localhost:5173';
const EMAIL = 'test-automation@shadowsanctuary.local';
const PASS = 'TestPassword123!';
const SS_DIR = path.resolve('public/assets/avatar-tests');

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);
        const emailInput = await page.$('input[type="email"]');
        const passInput = await page.$('input[type="password"]');
        await emailInput.fill(EMAIL);
        await passInput.fill(PASS);
        const submitBtn = await page.$('#login-submit, button[type="submit"]');
        if (submitBtn) await submitBtn.click();
        await page.waitForTimeout(4000);
        await page.evaluate(() => {
            localStorage.setItem('intake_completed', 'true');
            localStorage.setItem('avatar_config', JSON.stringify({ hairstyle: 'locs', robe: 'charcoal' }));
        });
        await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(3000);

        // List all buttons to see what's available
        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim().substring(0, 50));
        });
        console.log('Buttons on screen after login:', buttons);

        // Try clicking Shadow Tome tab
        const clicked = await page.evaluate(() => {
            const all = Array.from(document.querySelectorAll('button, [role="tab"], nav a, .tab, .tb'));
            console.log('All clickable elements:', all.map(el => el.textContent?.trim()));
            const b = all.find(el => el.textContent && el.textContent.trim().toLowerCase().includes('shadow tome'));
            if (b) { b.click(); return b.textContent.trim(); }
            return null;
        });
        console.log('Clicked tab:', clicked);
        await page.waitForTimeout(2000);

        await page.screenshot({ path: path.join(SS_DIR, 'debug_shadow_tome_tab.png') });

        const buttons2 = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim().substring(0, 80));
        });
        console.log('Buttons after tab click:', buttons2);

        const hasSummonTea = buttons2.some(b => b.toLowerCase().includes('summon tea'));
        console.log('Has "Summon Tea Blends" button:', hasSummonTea);

        if (hasSummonTea) {
            const clicked2 = await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const b = btns.find(b => b.innerText.toLowerCase().includes('summon tea'));
                if (b) { b.click(); return b.innerText.trim(); }
                return null;
            });
            console.log('Clicked:', clicked2);
            await page.waitForTimeout(2000);

            const buttons3 = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim().substring(0, 80));
            });
            console.log('Buttons after modal open:', buttons3);

            await page.screenshot({ path: path.join(SS_DIR, 'debug_shadow_tome_modal.png') });
        }

    } finally {
        await browser.close();
    }
}

main().catch(console.error);
