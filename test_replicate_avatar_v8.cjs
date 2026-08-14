const fs = require('fs');

async function runAttempt(attemptNum) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        // Using v7_pass2_attempt2 as foundation (red sandals version)
        const imgPath = 'public/assets/avatar-tests/nano_banana_avatar_test_v7_pass2_attempt2.png';
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const uri = `data:image/jpeg;base64,${base64}`;

        const prompt = "TARGETED EDITS: 1. Fingernail polish color is black or deep red (not silver). 2. Kimono is dramatically oversized and voluminous, with extremely wide billowing sleeves and a long trailing hem sweeping the floor. 3. Small, delicate, dainty, thin chain ankle bracelets on the ankles. 4. NO calf bracelets (bare calves other than tattoos). 5. Traditional Japanese GETA sandals on the feet: flat wooden board elevated by two distinct separate wooden teeth (ha) with a visible gap between them, single V-shaped fabric thong (hanao) splitting big toe and second toe. Lacquered black or deep red. 5-6 inches tall platform. IDENTITY LOCK: Preserve exact face, facial piercings, hair, hairpins, dangling hair chains, solid choker collar, exact tattoo placement/ink on legs/arms/chest, exact hourglass body proportions, left hand jewelry, black-and-red crane kimono color/pattern, and background. AVOID: silver nails, tight kimono, chunky ankle bracelets, calf bracelets, solid wedge sandals, multiple straps on sandals.";

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
        fs.writeFileSync(`replicate_raw_response_v8_attempt${attemptNum}.json`, JSON.stringify(data, null, 2));
        
        while (data.status === 'starting' || data.status === 'processing') {
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            data = await pollRes.json();
            fs.writeFileSync(`replicate_raw_response_v8_attempt${attemptNum}.json`, JSON.stringify(data, null, 2));
        }

        console.log(`[Attempt ${attemptNum}] Prediction status: ${data.status}`);
        if (data.status === 'succeeded' && data.output) {
            const imageRes = await fetch(data.output);
            const buffer = await imageRes.arrayBuffer();
            const outPath = `public/assets/avatar-tests/nano_banana_avatar_test_v8_attempt${attemptNum}.png`;
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
