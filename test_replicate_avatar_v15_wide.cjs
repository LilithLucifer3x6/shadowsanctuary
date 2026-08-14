const fs = require('fs');

async function runPrompt(roomName, customScene, retries = 20) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        const imgPath = 'public/assets/avatar-tests/nano_banana_avatar_test_v11_attempt1.png';
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const uri = `data:image/jpeg;base64,${base64}`;

        const prompt = `WIDE FULL-BODY SHOT — the entire character must be visible from head to feet, including the sandals, with clear margin/space above the head and below the feet. Do NOT crop at the waist, chest, or knees. Camera pulled back to show the full figure AND a generous amount of the surrounding room/scene. IDENTITY LOCK: Preserve exact face, PRESERVE FACIAL PIERCINGS EXACTLY AS SHOWN IN THE REFERENCE (nose ring, ear piercings, etc), choker collar, hourglass body proportions, skin tone, pencil-thin microlocs updo, silver hand jewelry. EXPLICIT INSTRUCTION: Clear, well-defined, undistorted eyes matching the reference image's eye rendering perfectly. NO GOLD. TATTOOS: Bold black ink. ANKLES: Dangly silver bracelets. KIMONO: Furisode-style wide sleeves, black with red interior and pink cherry blossoms. SANDALS: Perfectly matching, symmetrical tall platform geta with two teeth. ART STYLE: Painterly/illustrated digital art style, matching the reference image perfectly. ABSOLUTELY NO PHOTOREALISM. ASPECT RATIO FRAMING: This is a 9:16 portrait image. Ensure the avatar and key scene elements remain well-composed and are not cropped awkwardly at this taller/wider framing. ACTION AND SCENE: ${customScene}`;

        console.log(`[${roomName}] Making request to Replicate API (9:16 WIDE)...`);

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
        const jsonOut = `replicate_raw_response_part3_916_wide_${roomName}.json`;
        fs.writeFileSync(jsonOut, JSON.stringify(data, null, 2));
        
        while (data.status === 'starting' || data.status === 'processing') {
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            data = await pollRes.json();
            fs.writeFileSync(jsonOut, JSON.stringify(data, null, 2));
        }

        console.log(`[${roomName}] Prediction status: ${data.status}`);
        if (data.status === 'succeeded' && data.output) {
            const imageRes = await fetch(data.output);
            const buffer = await imageRes.arrayBuffer();
            const outPath = `public/assets/avatar-tests/part3_916_${roomName}.png`; // overwrite existing
            fs.writeFileSync(outPath, Buffer.from(buffer));
            console.log(`[${roomName}] Saved output to ${outPath}`);
        } else if (data.status === 'failed') {
            console.log(`[${roomName}] Failed! Error: ${data.error}`);
            if (data.error && data.error.includes('ModelRateLimitError') && retries > 0) {
                console.log(`[${roomName}] Rate limit hit. Waiting 30 seconds and retrying... (${retries} retries left)`);
                await new Promise(r => setTimeout(r, 30000));
                return await runPrompt(roomName, customScene, retries - 1);
            }
        }
    } catch (e) {
        console.error(`[${roomName}] Error:`, e);
    }
}

async function main() {
    const rooms = [
        { name: 'shadow_tome', scene: 'Shadow Tome reading. The character is seated in a cozy, intimate reading nook, holding an open ancient book. A traditional Japanese-style ceramic teacup sits nearby, consistent with drinking tea while reading. The setting features dark wood, shadows, lit primarily by a single traditional glowing floor lantern.' }
    ];

    for (const room of rooms) {
        await runPrompt(room.name, room.scene);
    }
}

main();
