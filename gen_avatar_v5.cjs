const fs = require('fs');
const puppeteer = require('puppeteer');

async function runPrompt(viewName, anglePrompt, retries = 5) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        // Use the original confirmed reference image (avatar-anchor-v2-3q.jpg)
        const imgPath = `docs/proofs/avatar-anchor-v2-3q.jpg`;
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const uri = `data:image/jpeg;base64,${base64}`;

        const prompt = `PORTRAIT FULL-BODY SHOT. ${anglePrompt}

IDENTITY & BODY LOCK: Preserve the exact face, deep umber skin, and art style of the reference image. NO little white dot makeup. Dark, elegant, sultry makeup matching her robe. Plus-size Black woman, explicitly 265 lbs, very heavy and curvy with thick thighs/bust, but a true waist still defined. Pure black hair (NO reddish-brown), true micro-locs. Long stiletto nails. Both hands heavily tattooed with rings.

PIERCINGS (EXACT): ABSOLUTELY BARE skin between eyebrows and on the bridge of the nose — NO dots, NO piercings there. Septum ring. Snake bites (two silver studs ONLY ON the bottom lip, NOT below it). Elaborate ear jewelry, industrial bar (NO butterfly earrings). Snug moon choker at the throat. 

HAIR ACCESSORIES: Symmetric hair sticks (3 on each side). Hair chains looping between the sticks with star and moon charms.

TATTOOS: Exact same crescent moon and botanical linework patterns as the reference, but make the ink a deep, rich, dark, pure black. DO NOT lose the tattoos.

ROBE: Crimson furisode-style robe with silver crane and cherry blossom embroidery. It must be HUGE, multi-layered, ceremonial style, but still sexy, off-the-shoulder, and open in the front with a deep plunging neckline and high leg slit. The INSIDE lining of the robe MUST be pure BLACK (not red). 

FOOTWEAR: Traditional Japanese wooden geta sandals, crimson straps, black wooden platform. The teeth must be stacked close together near the middle of the shoe (tengu-style balancing geta), 9+ inches extremely tall.

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
                    image_input: [uri],
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
            const outPath = `docs/proofs/avatar-v5-${viewName}.png`;
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
                <img src="file://${__dirname.replace(/\\/g, '/')}/docs/proofs/avatar-v5-front.png" style="height: 1080px; width: auto;" />
                <img src="file://${__dirname.replace(/\\/g, '/')}/docs/proofs/avatar-v5-back.png" style="height: 1080px; width: auto;" />
            </div>
        </body>
    </html>`;
    fs.writeFileSync('temp_sheet.html', html);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1120 });
    await page.goto(`file://${__dirname.replace(/\\/g, '/')}/temp_sheet.html`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'docs/proofs/avatar-anchor-v5.png', fullPage: true });
    await browser.close();
    fs.unlinkSync('temp_sheet.html');
    console.log('Saved combined sheet to docs/proofs/avatar-anchor-v5.png');
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
