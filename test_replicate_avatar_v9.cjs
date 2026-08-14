const fs = require('fs');

async function runAttempt(attemptNum) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        // Using v7_pass1_attempt2 as the foundation to reset the drift.
        const imgPath = 'public/assets/avatar-tests/nano_banana_avatar_test_v7_pass1_attempt2.png';
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const uri = `data:image/jpeg;base64,${base64}`;

        // The prompt specifically addresses the locked elements, the NO GOLD rule, the texture, symmetry, ink color, and geta structure.
        const prompt = "IDENTITY LOCK: Preserve exact face, facial piercings, choker collar, exact hourglass body proportions, and background. NO GOLD ANYWHERE ON THE CHARACTER. TARGETED EDITS: 1. Hair texture MUST be PENCIL-THIN MICROLOCS specifically, styled into the traditional updo (not straight, not silky). 2. Hairpins and hanging chains MUST be an exact mirrored/reflected arrangement on both sides (perfectly symmetrical count). 3. Tattoo ink MUST be genuinely deep black ink, high contrast against the skin tone (not blue, not navy). 4. Small, thin, delicate SILVER ankle bracelets (NO GOLD). 5. NO calf bracelets (bare calves). 6. Kimono is mostly BLACK with RED interior/accents and PINK cherry blossoms. 7. Left hand has silver ring/chain jewelry, right hand is bare/minimal rings. 8. Traditional Japanese GETA sandals on feet: flat wooden board elevated by two distinct separate wooden teeth (ha) with a visible wide gap between them, single V-shaped fabric thong (hanao), lacquered black or deep red. AVOID: straight hair, uneven hairpins, blue tattoos, chunky ankle cuffs, gold jewelry, calf bracelets, solid wedge sandals, mostly red kimono.";

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
        fs.writeFileSync(`replicate_raw_response_v9_attempt${attemptNum}.json`, JSON.stringify(data, null, 2));
        
        while (data.status === 'starting' || data.status === 'processing') {
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            data = await pollRes.json();
            fs.writeFileSync(`replicate_raw_response_v9_attempt${attemptNum}.json`, JSON.stringify(data, null, 2));
        }

        console.log(`[Attempt ${attemptNum}] Prediction status: ${data.status}`);
        if (data.status === 'succeeded' && data.output) {
            const imageRes = await fetch(data.output);
            const buffer = await imageRes.arrayBuffer();
            const outPath = `public/assets/avatar-tests/nano_banana_avatar_test_v9_attempt${attemptNum}.png`;
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
    await runAttempt(1);
    await runAttempt(2);
}

main();
