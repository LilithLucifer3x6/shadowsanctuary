/**
 * capture_tea_v2.cjs
 * Fetches real tea product image via OBF API JSON, downloads the actual image bytes.
 */
const { chromium } = require('playwright');
const fs = require('fs');

async function captureTea() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Query OBF API for known tea products and get their image URLs
    const barcodes = [
        '0070177154603',   // Twinings
        '0016000486256',   // Celestial Seasonings Chamomile
        '0070896005003',   // Bigelow Chamomile
        '0076950450218',   // Yogi Bedtime
        '3228857000166',   // Lipton
    ];

    let imageUrl = null;
    for (const barcode of barcodes) {
        try {
            console.log(`Trying OBF API for barcode: ${barcode}`);
            const result = await page.evaluate(async (bc) => {
                try {
                    const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${bc}.json`, {
                        headers: { 'User-Agent': 'ShadowSanctuary-Test/1.0' }
                    });
                    if (!r.ok) return null;
                    const d = await r.json();
                    if (d.status !== 1) return null;
                    return d.product?.image_front_url || d.product?.image_url || null;
                } catch(e) { return null; }
            }, barcode);
            
            if (result) {
                console.log(`Got image URL: ${result}`);
                imageUrl = result;
                break;
            }
        } catch(e) { console.log(`Barcode ${barcode} failed: ${e.message}`); }
    }

    if (imageUrl) {
        // Navigate to the image URL directly and screenshot it
        try {
            await page.goto(imageUrl, { timeout: 15000 });
            await page.waitForTimeout(2000);
            const imgEl = await page.$('img, body');
            if (imgEl) {
                await imgEl.screenshot({ path: 'tea_real.jpg' });
            } else {
                await page.screenshot({ path: 'tea_real.jpg' });
            }
            const size = fs.statSync('tea_real.jpg').size;
            console.log(`Saved via OBF image URL: ${size} bytes`);
            if (size > 20000) {
                console.log('SUCCESS: Valid tea product image saved.');
                await browser.close();
                return;
            }
        } catch(e) { console.log(`Image URL fetch failed: ${e.message}`); }
    }

    // Absolute fallback: use Playwright to browse to Bigelow tea and screenshot the product image directly
    console.log('Trying Bigelow tea direct product image...');
    try {
        await page.goto('https://www.bigelowtea.com/products/chamomile-herbal-tea-bags', { 
            waitUntil: 'domcontentloaded', timeout: 20000 
        });
        await page.waitForTimeout(4000);
        
        // Find the product image
        const productImg = await page.$('img[src*="cdn"], img[src*="bigelow"], .product__image img, [data-product-image] img, picture img');
        if (productImg) {
            await productImg.screenshot({ path: 'tea_real.jpg' });
            const size = fs.statSync('tea_real.jpg').size;
            console.log(`Saved Bigelow product image: ${size} bytes`);
        } else {
            // Screenshot the viewport focused on where product images typically are
            await page.screenshot({ path: 'tea_real.jpg', clip: { x: 0, y: 80, width: 700, height: 700 } });
            console.log('Saved page crop from Bigelow');
        }
    } catch(e) { console.log(`Bigelow failed: ${e.message}`); }

    await browser.close();

    const size = fs.existsSync('tea_real.jpg') ? fs.statSync('tea_real.jpg').size : 0;
    console.log(`\nFINAL tea_real.jpg size: ${size} bytes`);
    if (size > 20000) console.log('VALID — proceed with this image');
    else console.log('WARNING — image may be too small or incorrect');
}

captureTea().catch(console.error);
