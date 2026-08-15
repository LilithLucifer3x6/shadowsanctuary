const fs = require('fs');
const puppeteer = require('puppeteer');

async function runPrompt(viewName, anglePrompt, retries = 5) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        // 1. Character reference
        const charImgPath = `C:/Users/purpl/.gemini/antigravity/brain/0be76408-6bc5-4ff5-a2bb-20a516df3f62/.user_uploaded/media_1786810907666.png`;
        const charBase64 = fs.readFileSync(charImgPath).toString('base64');
        const charUri = `data:image/png;base64,${charBase64}`;

        // 2. Shoe reference
        const shoeImgPath = `C:/Users/purpl/.gemini/antigravity/brain/0be76408-6bc5-4ff5-a2bb-20a516df3f62/.user_uploaded/media_1786810907794.png`;
        const shoeBase64 = fs.readFileSync(shoeImgPath).toString('base64');
        const shoeUri = `data:image/png;base64,${shoeBase64}`;

        const prompt = `PORTRAIT FULL-BODY SHOT. ${anglePrompt}

IDENTITY & BODY LOCK: Use the first reference image as an absolute strict lock for her face, identity, and tattoos. Plus-size Black woman, explicitly 265 lbs, curvy, heavy, full figure with true waist defined. Deep umber skin. Pure black hair (NO reddish-brown), true micro-locs. NO little white dot makeup. Give her elegant, dark, sultry makeup matching the elaborate robe. Long stiletto nails. Both hands heavily tattooed and wearing lots of jewelry/rings.

PIERCINGS (STRICT): ABSOLUTELY BARE skin between eyebrows and on the bridge of the nose — NO dots, NO piercings there. Septum ring. Snake bites (two silver studs ONLY ON the bottom lip, NOT below it). Elaborate ear jewelry, industrial bar (NO butterfly earrings). Snug moon choker at the throat. 

HAIR ACCESSORIES: Symmetric hair sticks (3 on each side). Hair chains looping between the sticks with star and moon charms.

TATTOOS: Exact same crescent moon and botanical linework patterns as the reference, but make the ink a deep, rich, dark, pure black. DO NOT lose the tattoos on her chest and legs. Add them to both hands.

ROBE: Crimson furisode-style robe with silver crane and cherry blossom embroidery. It must be HUGE, multi-layered, ceremonial style, but still sexy, off-the-shoulder, and open in the front with a deep plunging neckline and high leg slit. The INSIDE lining of the robe MUST be pure BLACK (not red). 

FOOTWEAR: Traditional Japanese wooden geta sandals, 9+ inches extremely tall, crimson straps, black platform. Use the second reference image for the exact shape: there are TWO separate skinny teeth under each shoe, and BOTH teeth are positioned more towards the middle of the shoe. Neither tooth is stacked directly under the front toe or the back heel, they are both drawn inwards towards the center. 

ART STYLE: Painterly/illustrated digital art matching the reference exactly. No photorealism. Do not put a quarter or coin on the floor.`;

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
            const outPath = `docs/proofs/avatar-v6-${viewName}.png`;
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
                <img src="file://${__dirname.replace(/\\/g, '/')}/docs/proofs/avatar-v6-front.png" style="height: 1080px; width: auto;" />
                <img src="file://${__dirname.replace(/\\/g, '/')}/docs/proofs/avatar-v6-back.png" style="height: 1080px; width: auto;" />
            </div>
        </body>
    </html>`;
    fs.writeFileSync('temp_sheet.html', html);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1120 });
    await page.goto(`file://${__dirname.replace(/\\/g, '/')}/temp_sheet.html`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'docs/proofs/avatar-anchor-v6.png', fullPage: true });
    await browser.close();
    fs.unlinkSync('temp_sheet.html');
    console.log('Saved combined sheet to docs/proofs/avatar-anchor-v6.png');
}

(async () => {
    console.log('Starting Front View Generation...');
    const frontPrompt = "ANGLE AND POSE: True FRONT-FACING standing view — straight on, full body, head to feet. The character is looking directly at the camera. The large obi back-bow is partially visible wrapping around from the back.";
    const frontSuccess = await runPrompt('front', frontPrompt);

    console.log('Starting Back View Generation...');
    const backPrompt = "ANGLE AND POSE: True BACK view — standing straight, full body, seen directly from behind. The character is facing away from the viewer. The large, traditional obi back-bow is clearly visible and prominent on her lower back.";
    const backSuccess = await runPrompt('back', backPrompt);

    if (frontSuccess && backSuccess) {
        await combineImages();
    } else {
        console.log('Failed to generate one or both images.');
    }
    console.log('Done.');
})();
