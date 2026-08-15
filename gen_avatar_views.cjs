const fs = require('fs');

async function runPrompt(viewName, additionalConstraints, retries = 5) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        // Use the newly approved anchor image
        const imgPath = `docs/proofs/avatar-anchor-v2-3q.jpg`;
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const uri = `data:image/jpeg;base64,${base64}`;

        const prompt = `PORTRAIT FULL-BODY SHOT WITH EXTRA VERTICAL MARGIN — the entire character must be visible from head to feet. IDENTITY LOCK: Preserve exact face, plus-size hourglass body (5'8", 256 lbs, real waist definition with fuller bust/hips), deep umber skin tone, pencil-thin microlocs updo, snug choker collar. ABSOLUTELY NO piercing, dot, or mark of any kind between the eyebrows or on the nose bridge. ATTIRE STRICT LOCK: exact same sexy, floor-length, revealing styling as reference. DO NOT reduce skin exposure, do not shorten the kimono, do not cover the shoulders. Crimson furisode-style robe with silver crane and cherry blossom embroidery, solid BLACK inside lining. OBI BOW: A large, traditional, decorative sash knot tied at the back of the obi, sitting between the shoulder blades/lower back. It wraps around from the back. TATTOOS: Deep, rich, bold black ink. ANKLES: Dangly silver bracelets fully wrapping the ankles. FOOTWEAR CORRECTION: genuine traditional Japanese geta sandals with a black platform, crimson straps, and extremely tall 9+ inch wooden platform featuring two distinct, separated teeth/blocks underneath with a clear, visible gap between them (not a solid wedge). ART STYLE: Painterly/illustrated digital art, matching reference style — ABSOLUTELY NO PHOTOREALISM. ANATOMY: anatomically correct poses, proper proportions, 2 arms, 2 legs. ${additionalConstraints}`;

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
            const outPath = `docs/proofs/avatar-anchor-v2-${viewName}.png`;
            fs.writeFileSync(outPath, Buffer.from(buffer));
            console.log(`[${viewName}] Successfully saved to ${outPath}`);
            return true;
        } else {
            console.error(`[${viewName}] Generation failed. Data:`, data);
            if (retries > 0) {
                console.log(`[${viewName}] Retrying... (${retries} left)`);
                await new Promise(r => setTimeout(r, 2000));
                return await runPrompt(viewName, additionalConstraints, retries - 1);
            }
            return false;
        }
    } catch (e) {
        console.error(`[${viewName}] Error:`, e);
        if (retries > 0) {
            console.log(`[${viewName}] Retrying... (${retries} left)`);
            await new Promise(r => setTimeout(r, 2000));
            return await runPrompt(viewName, additionalConstraints, retries - 1);
        }
        return false;
    }
}

(async () => {
    console.log('Starting Front View Generation...');
    const frontConstraints = "ANGLE AND POSE: True FRONT-FACING standing view — straight on, full body, head to feet. The character is looking directly at the camera (straight-on portrait). The large obi back-bow is partially visible wrapping around from the back.";
    await runPrompt('front', frontConstraints);

    console.log('Starting Back View Generation...');
    const backConstraints = "ANGLE AND POSE: True BACK view — standing straight, full body, seen directly from behind. The character is facing away from the viewer. The large, traditional obi back-bow is clearly visible and prominent on her lower back.";
    await runPrompt('back', backConstraints);
    
    console.log('Done.');
})();
