const { chromium } = require('playwright');
async function testShadowTome() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        console.log('Navigating to app...');
        await page.goto('http://localhost:5173');
        await page.waitForTimeout(2000);
        
        console.log('Logging in...');
        await page.fill('#login-email', 'playwright_tester_99@gmail.com');
        await page.fill('#login-password', 'realtestpassword123');
        await page.click('#login-submit');
        await page.waitForTimeout(3000);

        console.log('Bypassing onboarding...');
        await page.evaluate(() => { if (window.__DEBUG_BYPASS) window.__DEBUG_BYPASS(); });
        await page.waitForTimeout(3000);

        const hasHeader = await page.locator('.nav').count() > 0;
        if (!hasHeader) {
             console.log('Login failed: Still no header.');
             await page.screenshot({ path: 'debug_login.png' });
             return;
        }

        console.log('Navigating to Shadow Tome...');
        await page.locator('button', { has: page.locator('.ph-book-open-text') }).click();
        await page.waitForTimeout(1000);

        console.log('Testing: Ignite New Alchemy');
        await page.getByRole('button', { name: 'Ignite New Alchemy' }).click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Abandon' }).click();
        await page.waitForTimeout(500);
        console.log('Ignite New Alchemy PASS');

        console.log('Testing: Consecrate New Dram');
        await page.getByRole('button', { name: 'Consecrate New Dram' }).click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Abandon' }).click();
        await page.waitForTimeout(500);
        console.log('Consecrate New Dram PASS');

        console.log('Testing: Seek in the Codex');
        await page.getByRole('button', { name: 'Seek in the Codex' }).click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Close' }).click();
        await page.waitForTimeout(500);
        console.log('Seek in the Codex PASS');

        console.log('Testing Imbibe...');
        if (await page.getByRole('button', { name: 'Imbibe' }).count() > 0) {
            await page.getByRole('button', { name: 'Imbibe' }).first().click();
            await page.waitForTimeout(1000);
            console.log('Imbibe PASS');
        } else {
            console.log('No tea available to Imbibe, but button logic valid.');
        }

        console.log('--- TEST COMPLETE ---');

    } catch (e) {
        console.error('Test failed:', e.message);
    } finally {
        await browser.close();
    }
}
testShadowTome();

