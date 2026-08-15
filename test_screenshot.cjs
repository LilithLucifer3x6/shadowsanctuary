const { chromium } = require('playwright');
async function run() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        await page.goto('http://localhost:5173');
        await page.evaluate(() => {
            sessionStorage.setItem('al_currentScreen', 'app');
            localStorage.setItem('avatar_config', '{}');
            window.location.reload();
        });
        await page.waitForNavigation();
        await page.waitForLoadState('networkidle');

        await page.evaluate(() => {
            const tabs = document.querySelectorAll('.tabs button');
            if(tabs[3]) tabs[3].click();
        });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'debug_shadowtome.png', fullPage: true });
    } catch(e) { console.error(e); }
    finally { await browser.close(); }
}
run();
