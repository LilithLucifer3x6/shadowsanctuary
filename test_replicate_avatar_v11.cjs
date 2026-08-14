const fs = require('fs');

async function runAttempt(attemptNum) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        const imgPath = 'public/assets/avatar-tests/nano_banana_avatar_test_v9_attempt2.png';
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const uri = `data:image/jpeg;base64,${base64}`;

        const prompt = "IDENTITY LOCK: Preserve exact face, facial piercings, choker collar, hourglass body proportions, skin tone, pencil-thin microlocs updo, and left hand silver jewelry. NO GOLD ANYWHERE ON THE CHARACTER. (Sandals and kimono shape intentionally excluded from preservation). ACTION AND SCENE: Mortal Rites daily ritual. The character is actively drinking from a small ornate ritual teacup (or holding a small glass vial). The setting is an interior traditional Japanese manor room in the woods, styled as a witchy ritual space with dark wood, tatami mats, glowing candles, and incense smoke. SPECIFIC TARGETS: 1. SANDALS: Traditional GETA sandals that are EXTREMELY TALL (9-10 inches high platform), towering, with two distinct separate wooden teeth (ha) and a wide gap between them. 2. HAIRPINS: On the RIGHT side of her head, she wears exactly 3 long hairpins and exactly 2 hanging silver chains. The LEFT side must be an exact mirror duplicate of the right side just described. 3. TATTOOS: Bold, stark black ink tattoos (zero blue tint). 4. ANKLE BRACELETS: Dangly, delicate, non-melting silver ankle bracelets on both ankles. Bare calves. 5. KIMONO: Furisode-style exaggerated wide sleeves, significantly wider and billowy in the body (not just a long hem), mostly BLACK with RED interior and pink cherry blossoms.";

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
        fs.writeFileSync(`replicate_raw_response_v11_attempt${attemptNum}.json`, JSON.stringify(data, null, 2));
        
        while (data.status === 'starting' || data.status === 'processing') {
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            data = await pollRes.json();
            fs.writeFileSync(`replicate_raw_response_v11_attempt${attemptNum}.json`, JSON.stringify(data, null, 2));
        }

        console.log(`[Attempt ${attemptNum}] Prediction status: ${data.status}`);
        if (data.status === 'succeeded' && data.output) {
            const imageRes = await fetch(data.output);
            const buffer = await imageRes.arrayBuffer();
            const outPath = `public/assets/avatar-tests/nano_banana_avatar_test_v11_attempt${attemptNum}.png`;
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
}

main();
