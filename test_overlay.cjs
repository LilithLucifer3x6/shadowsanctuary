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

        const result = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const b = btns.find(x => x.textContent.includes('Ignite New Alchemy'));
            if (!b) return 'Button not found';
            
            const rect = b.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const elAtPoint = document.elementFromPoint(x, y);
            
            return {
                buttonTag: b.tagName,
                buttonClass: b.className,
                elementAtPointTag: elAtPoint ? elAtPoint.tagName : 'none',
                elementAtPointClass: elAtPoint ? elAtPoint.className : 'none',
                isSameNode: b === elAtPoint || b.contains(elAtPoint)
            };
        });
        console.log(result);
    } catch(e) { console.error(e); }
    finally { await browser.close(); }
}
run();
