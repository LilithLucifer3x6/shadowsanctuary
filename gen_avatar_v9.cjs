const fs = require('fs');
const puppeteer = require('puppeteer');

async function runPrompt(viewName, anglePrompt, seed, retries = 5) {
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

IDENTITY & BODY: Deep umber skin, 265 lbs, very heavy, curvy, thick thighs/bust, true waist. NO MOLE above the lip. ABSOLUTELY NO dots or piercings between the eyes (must be bare skin). 

HAIR: Pure black micro-locs. Small bun (indicating shoulder-length hair, NOT a giant bun). Smaller, reasonably sized hair sticks (exactly 3 on left, 3 on right). Looping chains connecting them. NO stray locs hanging down on the sides in the back or front view. 

PIERCINGS & EARS: Ears MUST have highly visible, elaborate ear jewelry and industrial bars. One highly apparent nostril ring on the left, one highly apparent nostril ring on the right. Snake bites (two silver dots strictly BELOW the lips). Black collar necklace with a moon pendant. Long stiletto nails.

TATTOOS: Deep, rich, dark tattoos with subtle colors woven in. DO NOT lose the chest tattoos. The chest, hands, and legs must be heavily tattooed.

ROBE: HUGE, elaborate ceremonial crimson furisode-style robe with silver crane and cherry blossom embroidery. Very sexy, off-the-shoulder, open in the front, high leg slit. INSIDE lining is pure BLACK. 
OBI BOW: A traditional Japanese OBI BELT BOW (not a standard ribbon bow). It must be EXACTLY THE SAME CRIMSON RED COLOR as the kimono. 

FOOTWEAR: Use the second reference image exactly for the SHOE SHAPE (Okobo-style traditional tall sloping solid wooden block, scooped out in the back). The platform MUST BE BLACK, and the straps MUST BE CRIMSON RED. Extremely tall.

ART STYLE: Painterly/illustrated digital art matching the character reference exactly. No photorealism. No quarter on the floor.`;

        console.log(`[${viewName}] Sending to google/nano-banana-pro with seed ${seed}...`);

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
                    resolution: '2K',
                    seed: seed
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
            const outPath = `docs/proofs/avatar-v9-${viewName}.png`;
            fs.writeFileSync(outPath, Buffer.from(buffer));
            console.log(`[${viewName}] Successfully saved to ${outPath}`);
            return true;
        } else {
            console.error(`[${viewName}] Generation failed. Data:`, data);
            if (retries > 0) {
                console.log(`[${viewName}] Retrying... (${retries} left)`);
                await new Promise(r => setTimeout(r, 2000));
                return await runPrompt(viewName, anglePrompt, seed, retries - 1);
            }
            return false;
        }
    } catch (e) {
        console.error(`[${viewName}] Error:`, e);
        if (retries > 0) {
            console.log(`[${viewName}] Retrying... (${retries} left)`);
            await new Promise(r => setTimeout(r, 2000));
            return await runPrompt(viewName, anglePrompt, seed, retries - 1);
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
                <img src="file://${__dirname.replace(/\\/g, '/')}/docs/proofs/avatar-v9-front.png" style="height: 1080px; width: auto;" />
                <img src="file://${__dirname.replace(/\\/g, '/')}/docs/proofs/avatar-v9-back.png" style="height: 1080px; width: auto;" />
            </div>
        </body>
    </html>`;
    fs.writeFileSync('temp_sheet.html', html);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1120 });
    await page.goto(`file://${__dirname.replace(/\\/g, '/')}/temp_sheet.html`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'docs/proofs/avatar-anchor-v9.png', fullPage: true });
    await browser.close();
    fs.unlinkSync('temp_sheet.html');
    console.log('Saved combined sheet to docs/proofs/avatar-anchor-v9.png');
}

(async () => {
    // Force the exact same random seed to ensure perfectly matching details between front and back views (no drift)
    const fixedSeed = 8888; 

    console.log('Starting Front View Generation...');
    const frontPrompt = "ANGLE AND POSE: True FRONT-FACING standing view — straight on, full body, head to feet. Hands are completely down at her sides, not blocking the front of the obi belt.";
    const frontSuccess = await runPrompt('front', frontPrompt, fixedSeed);

    console.log('Starting Back View Generation...');
    const backPrompt = "ANGLE AND POSE: True BACK view — standing straight, full body, seen directly from behind. The kimono robe must be very long and flowing, showing off the back. The HUGE traditional Japanese obi belt bow is massive on her lower back.";
    const backSuccess = await runPrompt('back', backPrompt, fixedSeed);

    if (frontSuccess && backSuccess) {
        await combineImages();
    } else {
        console.log('Failed to generate one or both images.');
    }
    console.log('Done.');
})();
