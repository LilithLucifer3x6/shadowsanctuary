/**
 * capture_tea_image.cjs
 * Uses Playwright to screenshot a real tea product page and crop the product image.
 * Saves result as tea_real.jpg
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureTea() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Try multiple grocery/tea product pages
    const urls = [
        // Yogi Tea Bedtime on Target
        'https://www.target.com/p/yogi-tea-bedtime-caffeine-free-herbal-tea-bags/-/A-13305825',
        // Celestial Seasonings on Amazon (no login needed for product image)
        'https://www.amazon.com/Celestial-Seasonings-Chamomile-Caffeine-Herbal/dp/B000GG5FLA',
        // Bigelow Tea official product page
        'https://www.bigelowtea.com/products/chamomile-herbal-tea-bags',
        // Twinings
        'https://www.twiningsusa.com/products/pure-chamomile-herbal-tea',
    ];

    let saved = false;
    for (const url of urls) {
        try {
            console.log(`Trying: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await page.waitForTimeout(3000);

            // Try to grab the main product image element
            const imgSelectors = [
                'img[data-testid*="product"]',
                'img[class*="product-image"]',
                'img[alt*="tea"]',
                'img[alt*="Tea"]',
                '.product-image img',
                '#main-image',
                '[data-component-type="s-product-image"] img',
                'img[src*="tea"]',
            ];

            let imgEl = null;
            for (const sel of imgSelectors) {
                imgEl = await page.$(sel);
                if (imgEl) { console.log(`Found img with selector: ${sel}`); break; }
            }

            if (imgEl) {
                await imgEl.screenshot({ path: 'tea_real.jpg' });
                const size = fs.statSync('tea_real.jpg').size;
                console.log(`Saved tea_real.jpg from element screenshot (${size} bytes)`);
                if (size > 10000) { saved = true; break; }
            }

            // Fallback: full page screenshot cropped to top
            await page.screenshot({ path: 'tea_real.jpg', clip: { x: 0, y: 0, width: 600, height: 600 } });
            const size = fs.statSync('tea_real.jpg').size;
            console.log(`Saved tea_real.jpg from page crop (${size} bytes)`);
            if (size > 10000) { saved = true; break; }

        } catch (e) {
            console.log(`Failed ${url}: ${e.message}`);
        }
    }

    if (!saved) {
        // Last resort: generate a real tea image with a known product barcode from Open Food Facts API
        console.log('All URLs failed. Trying OBF API for image URL...');
        try {
            const resp = await page.evaluate(async () => {
                const r = await fetch('https://world.openfoodfacts.org/api/v0/product/0070177154603.json');
                const d = await r.json();
                return d?.product?.image_url || d?.product?.image_front_url || null;
            });
            if (resp) {
                console.log(`Got image URL from OBF API: ${resp}`);
                await page.goto(resp, { timeout: 10000 });
                await page.screenshot({ path: 'tea_real.jpg' });
                console.log('Saved from OBF API image URL');
                saved = true;
            }
        } catch(e) { console.log(`OBF API failed: ${e.message}`); }
    }

    await browser.close();
    
    if (saved) {
        const size = fs.statSync('tea_real.jpg').size;
        console.log(`\nFINAL: tea_real.jpg is ${size} bytes — ${size > 10000 ? 'VALID real image' : 'TOO SMALL, likely invalid'}`);
    } else {
        console.log('\nFAILED: Could not capture any real tea product image.');
    }
}

captureTea().catch(console.error);
