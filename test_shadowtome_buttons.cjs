const { chromium } = require('playwright');
async function run() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`[BROWSER ERROR] ${msg.text()}`);
        } else if (msg.type() === 'warning') {
            // ignore
        } else {
            console.log(`[BROWSER LOG] ${msg.text()}`);
        }
    });
    page.on('pageerror', error => {
        console.log(`[UNCAUGHT PAGE ERROR] ${error.message}`);
    });

    try {
        console.log('Navigating to http://localhost:5173...');
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('networkidle');

        console.log('Clicking "The First Inscription" to open login modal...');
        await page.locator('button', { hasText: 'The First Inscription' }).click();
        await page.waitForTimeout(1000);

        console.log('Logging in as playwright_tester_99@gmail.com...');
        await page.fill('#login-email', 'playwright_tester_99@gmail.com');
        await page.fill('#login-password', 'realtestpassword123');
        await page.click('button[type="submit"]');
        
        await page.waitForTimeout(3000);

        const continueBtn = await page.locator('button', { hasText: 'Continue to the Sanctuary' }).count();
        if (continueBtn > 0) {
            console.log('Bypassing Avatar Customizer...');
            await page.locator('button', { hasText: 'Continue to the Sanctuary' }).first().click();
            await page.waitForTimeout(2000);
        }

        console.log('Switching to Shadow Tome...');
        await page.evaluate(() => {
            const tabs = document.querySelectorAll('.tabs button');
            if(tabs[3]) tabs[3].click();
        });
        await page.waitForTimeout(2000);

        console.log('\n--- CLICKING BUTTONS ---');
        
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Ignite New Alchemy'));
            if (b) {
                console.log('Clicking Ignite New Alchemy via JS');
                b.click();
            } else console.log('[BROWSER ERROR] Ignite New Alchemy not found');
        });
        await page.waitForTimeout(1000);

        console.log('\n--- TEST COMPLETE ---');
    } catch (e) {
        console.error('Test script crashed:', e);
    } finally {
        await browser.close();
    }
}
run();
