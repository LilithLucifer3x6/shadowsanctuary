const fs = require('fs');

async function runPrompt(retries = 5) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        // Use the original provided base image
        const imgPath = `docs/proofs/avatar-anchor-v2-3q.jpg`; 
        // Note: the model might fight side-by-side if I force image-to-image with a single person image.
        // But I will pass it to preserve the exact face and styling.
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const uri = `data:image/jpeg;base64,${base64}`;

        const prompt = `CHARACTER DESIGN SHEET: TWO FULL-BODY VIEWS SIDE-BY-SIDE IN ONE IMAGE. On the left: True Front-Facing view. On the right: True Back view. Do not put a quarter or coin on the floor.

IDENTITY & BODY: Plus-size Black woman, explicitly 265 lbs, heavy, curvy, genuine deep plus-size figure (not skinny!), deep umber skin. Black hair (pure black, NOT reddish-brown), styled in true micro-locs (locs, not braids). Long stiletto nails. Both hands heavily tattooed and wearing lots of jewelry, multiple rings. Elaborate makeup matching her elaborate robe.

PIERCINGS & FACE: ABSOLUTELY BARE skin between eyebrows and on the bridge of the nose — NO dots, NO piercings there. Septum ring (clean and elegant). Snake bites (two silver studs ONLY ON the bottom lip, NOT below it). Elaborate, highly noticeable ear jewelry, industrial bar and gauge (NO butterfly earrings). Snug moon choker at the throat. 

HAIR ACCESSORIES: Symmetric hair sticks (3 on each side). Hair chains looping between the sticks with star and moon charms.

TATTOOS: Deep, rich, dark, pure black ink. Very detailed, neat, high-quality crescent moon and botanical linework. Both hands tattooed. 

ROBE: Crimson furisode-style robe with silver crane and cherry blossom embroidery. It must be HUGE, multi-layered, ceremonial style, but still sexy, off-the-shoulder, and open in the front with a deep plunging neckline and high leg slit. The INSIDE lining of the robe MUST be pure BLACK (not red). Large traditional decorative obi back-bow visible in the back view.

FOOTWEAR: Traditional Japanese wooden geta sandals, crimson straps, black wooden platform. The teeth must be stacked close together near the middle of the shoe (making her balance), 9+ inches extremely tall.

ART STYLE: Painterly/illustrated digital art. 16:9 canvas showing front and back side-by-side.`;

        console.log(`Sending to google/nano-banana-pro...`);

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
                    aspect_ratio: '16:9',
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

        console.log(`Final status: ${data.status}`);

        if (data.status === 'succeeded' && data.output) {
            const imageRes = await fetch(data.output);
            const buffer = await imageRes.arrayBuffer();
            const outPath = `docs/proofs/avatar-anchor-v4.png`;
            fs.writeFileSync(outPath, Buffer.from(buffer));
            console.log(`Successfully saved to ${outPath}`);
            return true;
        } else {
            console.error(`Generation failed. Data:`, data);
            if (retries > 0) {
                console.log(`Retrying... (${retries} left)`);
                await new Promise(r => setTimeout(r, 2000));
                return await runPrompt(retries - 1);
            }
            return false;
        }
    } catch (e) {
        console.error(`Error:`, e);
        if (retries > 0) {
            console.log(`Retrying... (${retries} left)`);
            await new Promise(r => setTimeout(r, 2000));
            return await runPrompt(retries - 1);
        }
        return false;
    }
}

(async () => {
    await runPrompt();
})();
