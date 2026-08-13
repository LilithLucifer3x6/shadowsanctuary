/**
 * capture_tea_v3.cjs
 * Takes a full-page screenshot of a tea product page and saves the meaningful part.
 */
const { chromium } = require('playwright');
const fs = require('fs');

async function captureTea() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 900 });

    const attempts = [
        {
            url: 'https://www.bigelowtea.com/products/chamomile-herbal-tea-bags',
            imgSel: '.product__media img, .product-single__photo img, img[src*="chamomile"], img[alt*="Chamomile"], img[alt*="Tea"]',
            clip: { x: 0, y: 80, width: 600, height: 650 }
        },
        {
            url: 'https://www.twiningsusa.com/products/pure-chamomile-herbal-tea',
            imgSel: '.product-image img, .pdp-image img, img[alt*="chamomile"], img[alt*="Chamomile"]',
            clip: { x: 0, y: 80, width: 600, height: 650 }
        },
        {
            url: 'https://www.celestialseasonings.com/products/chamomile-herbal-tea',
            imgSel: '.product__image img, img[alt*="Chamomile"]',
            clip: { x: 0, y: 80, width: 600, height: 650 }
        }
    ];

    for (const attempt of attempts) {
        try {
            console.log(`\nTrying: ${attempt.url}`);
            await page.goto(attempt.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.waitForTimeout(3000);

            // Try element screenshot first
            const imgs = await page.$$(attempt.imgSel);
            console.log(`Found ${imgs.length} matching images`);
            
            for (const img of imgs) {
                try {
                    const box = await img.boundingBox();
                    if (box && box.width > 100 && box.height > 100) {
                        console.log(`  Image box: ${JSON.stringify(box)}`);
                        await img.screenshot({ path: 'tea_real.jpg' });
                        const size = fs.statSync('tea_real.jpg').size;
                        console.log(`  Saved element screenshot: ${size} bytes`);
                        if (size > 30000) {
                            console.log('SUCCESS');
                            await browser.close();
                            return;
                        }
                    }
                } catch(e) { /* skip */ }
            }

            // Fallback: full page crop
            await page.screenshot({ path: 'tea_real.jpg', clip: attempt.clip });
            const size = fs.statSync('tea_real.jpg').size;
            console.log(`Page crop: ${size} bytes`);
            if (size > 50000) {
                console.log('SUCCESS via crop');
                await browser.close();
                return;
            }
        } catch(e) {
            console.log(`Failed: ${e.message}`);
        }
    }

    // Final fallback: search Google Images for tea product and screenshot the first visible image
    try {
        console.log('\nTrying Google Images search...');
        await page.goto('https://www.google.com/search?q=chamomile+herbal+tea+bags+product+photo&tbm=isch', {
            waitUntil: 'domcontentloaded', timeout: 15000
        });
        await page.waitForTimeout(2000);
        const firstImg = await page.$('img[src^="https"]');
        if (firstImg) {
            await firstImg.screenshot({ path: 'tea_real.jpg' });
            const size = fs.statSync('tea_real.jpg').size;
            console.log(`Google Images first result: ${size} bytes`);
        }
    } catch(e) { console.log(`Google Images failed: ${e.message}`); }

    await browser.close();
    const size = fs.existsSync('tea_real.jpg') ? fs.statSync('tea_real.jpg').size : 0;
    console.log(`\nFINAL: ${size} bytes`);
}

captureTea().catch(console.error);
