const fs = require('fs');

async function runAttempt(attemptNum) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        const imgPath = 'public/assets/avatar-tests/avatar_kanzashi_silver_foundation.jpg';
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const uri = `data:image/jpeg;base64,${base64}`;

        const prompt = "TARGETED EDITS: 1. Bare legs instead of leggings/stockings. 2. Black ink tattoos directly on the bare thighs. 3. Taller elevated wooden platform geta sandals on the feet. 4. NO bangs/fringe across the forehead (hair pulled back). 5. Solid black band/choker around the neck holding the crescent pendant. IDENTITY LOCK: Preserve exact facial structure, art style, skin tone, hourglass body proportions (5'8\", 260 lbs, cinched waist, curvy hips, fupa), exact black-and-red crane kimono, silver obi, jewelry, hair ornaments (combs, pins), standing pose, and Japanese garden background exactly as they are in the reference image. AVOID: bangs, fringe, colored tattoos, floating necklaces, leggings, stockings, short sandals, flat sandals.";

        console.log(`[Attempt ${attemptNum}] Making request to Replicate API...`);

        const res = await fetch('https://api.replicate.com/v1/models/google/nano-banana-pro/predictions', {
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
                    aspect_ratio: '1:1',
                    output_format: 'png',
                    resolution: '2K'
                }
            })
        });

        let data = await res.json();
        fs.writeFileSync(`replicate_raw_response_v5_attempt${attemptNum}.json`, JSON.stringify(data, null, 2));
        
        while (data.status === 'starting' || data.status === 'processing') {
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            data = await pollRes.json();
            fs.writeFileSync(`replicate_raw_response_v5_attempt${attemptNum}.json`, JSON.stringify(data, null, 2));
        }

        console.log(`[Attempt ${attemptNum}] Prediction status: ${data.status}`);
        if (data.status === 'succeeded' && data.output) {
            const imageRes = await fetch(data.output);
            const buffer = await imageRes.arrayBuffer();
            const outPath = `public/assets/avatar-tests/nano_banana_avatar_test_v5_attempt${attemptNum}.png`;
            fs.writeFileSync(outPath, Buffer.from(buffer));
            console.log(`[Attempt ${attemptNum}] Saved output to ${outPath}`);
        } else if (data.status === 'failed') {
            console.log(`[Attempt ${attemptNum}] Failed! Error: ${data.error}`);
        }
    } catch (e) {
        console.error(`[Attempt ${attemptNum}] Error:`, e);
    }
}

async function main() {
    await runAttempt(2);
    await runAttempt(3);
}

main();
