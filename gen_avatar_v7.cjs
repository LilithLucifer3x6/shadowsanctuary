const fs = require('fs');
const puppeteer = require('puppeteer');

async function runPrompt(viewName, anglePrompt, retries = 5) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        const charImgPath = `C:/Users/purpl/.gemini/antigravity/brain/0be76408-6bc5-4ff5-a2bb-20a516df3f62/.user_uploaded/media_1786810907666.png`;
        const charBase64 = fs.readFileSync(charImgPath).toString('base64');
        const charUri = `data:image/png;base64,${charBase64}`;

        const shoeImgPath = `C:/Users/purpl/.gemini/antigravity/brain/0be76408-6bc5-4ff5-a2bb-20a516df3f62/.user_uploaded/media_1786812467040.png`;
        const shoeBase64 = fs.readFileSync(shoeImgPath).toString('base64');
        const shoeUri = `data:image/png;base64,${shoeBase64}`;

        const prompt = `PORTRAIT FULL-BODY SHOT. ${anglePrompt}

IDENTITY & BODY LOCK: Deep umber skin, 265 lbs, very heavy and curvy with thick thighs/bust, true waist. ABSOLUTELY NO FRONT BANGS (no hair hanging down in face). Pure black micro-locs. 

HAIR ACCESSORIES (ROYALTY LEVEL): Extremely accessorized traditional Japanese royalty styling. Exactly 3 hair sticks on the left, 3 on the right, perfectly symmetrical and neatly lined up. Looping festoon chains connecting from one end to the other, hung with stars and moons. ALL hanging chains must match the style of the chain beneath the bun. Add traditional elaborate hair combs.

FACE & PIERCINGS: ABSOLUTELY BARE skin between the eyes (no dots/piercings there). One eyebrow ring on the left, one eyebrow ring on the right. One nostril piercing on each side. Snake bites (two silver dots strictly BELOW the lips, not on the lips). Black collar necklace with a moon pendant hanging from it. Dark, sultry, elegant makeup. Long stiletto nails. 

TATTOOS: Deep, rich, dark tattoos with subtle colors woven in (forest botanical and celestial elements).

ROBE: HUGE, elaborate, multi-layered ceremonial crimson furisode-style robe with silver crane and cherry blossom embroidery. Very sexy, off-the-shoulder, open in the front, high leg slit. INSIDE lining is pure BLACK. 

FOOTWEAR & FEET: Use the second reference image exactly for the shoes (Okobo-style traditional tall sloping wooden block, red lacquer with floral designs, black strap). Extremely tall. Add ankle bracelets made of moons, stars, and forest witch shapes. Retain pretty toe rings.

ART STYLE: Painterly/illustrated digital art matching the character reference exactly. No photorealism. No quarter on the floor.`;

        console.log(`[${viewName}] Sending to google/nano-banana-pro...`);

        let res = await fetch('https://api.replicate.com/v1/models/google/nano-banana-pro/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Prefer': 'wait'
            },
            body: JSON.stringify({
                input: {
                    prompt,
                    image_input: [charUri, shoeUri],
                    aspect_ratio: '9:16',
                    output_format: 'png',
                    resolution: '2K'
                }
            })
        });

        let data = await res.json();
        
        while (data.status === 'starting' || data.status === 'processing') {
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            data = await pollRes.json();
        }

        console.log(`[${viewName}] Final status: ${data.status}`);

        if (data.status === 'succeeded' && data.output) {
            const imageRes = await fetch(data.output);
            const buffer = await imageRes.arrayBuffer();
            const outPath = `docs/proofs/avatar-v7-${viewName}.png`;
            fs.writeFileSync(outPath, Buffer.from(buffer));
            console.log(`[${viewName}] Successfully saved to ${outPath}`);
            return true;
        } else {
            console.error(`[${viewName}] Generation failed. Data:`, data);
            if (retries > 0) {
                console.log(`[${viewName}] Retrying... (${retries} left)`);
                await new Promise(r => setTimeout(r, 2000));
                return await runPrompt(viewName, anglePrompt, retries - 1);
            }
            return false;
        }
    } catch (e) {
        console.error(`[${viewName}] Error:`, e);
        if (retries > 0) {
            console.log(`[${viewName}] Retrying... (${retries} left)`);
            await new Promise(r => setTimeout(r, 2000));
            return await runPrompt(viewName, anglePrompt, retries - 1);
        }
        return false;
    }
}

async function combineImages() {
    console.log('Combining images into one character sheet...');
    const html = `
    <html>
        <body style="margin:0; padding:0; background: #1a1a1a; display:flex; justify-content:center; align-items:center;">
            <div style="display:flex; gap: 20px; padding: 20px;">
                <img src="file://${__dirname.replace(/\\/g, '/')}/docs/proofs/avatar-v7-front.png" style="height: 1080px; width: auto;" />
                <img src="file://${__dirname.replace(/\\/g, '/')}/docs/proofs/avatar-v7-back.png" style="height: 1080px; width: auto;" />
            </div>
        </body>
    </html>`;
    fs.writeFileSync('temp_sheet.html', html);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1120 });
    await page.goto(`file://${__dirname.replace(/\\/g, '/')}/temp_sheet.html`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'docs/proofs/avatar-anchor-v7.png', fullPage: true });
    await browser.close();
    fs.unlinkSync('temp_sheet.html');
    console.log('Saved combined sheet to docs/proofs/avatar-anchor-v7.png');
}

(async () => {
    console.log('Starting Front View Generation...');
    const frontPrompt = "ANGLE AND POSE: True FRONT-FACING standing view — straight on, full body, head to feet. Her hands must be positioned at her sides or out of the way so the front obi belt is completely visible and unobstructed.";
    const frontSuccess = await runPrompt('front', frontPrompt);

    console.log('Starting Back View Generation...');
    const backPrompt = "ANGLE AND POSE: True BACK view — standing straight, full body, seen directly from behind. The kimono robe must be very long and flowing, showing off the back design. The HUGE decorative obi back-bow is massive on her lower back and MUST BE the EXACT SAME crimson red color as the rest of the kimono.";
    const backSuccess = await runPrompt('back', backPrompt);

    if (frontSuccess && backSuccess) {
        await combineImages();
    } else {
        console.log('Failed to generate one or both images.');
    }
    console.log('Done.');
})();
