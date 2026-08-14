const fs = require('fs');

async function runPrompt(roomName, customScene) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        // Use the locked avatar reference
        const imgPath = 'public/assets/avatar-tests/nano_banana_avatar_test_v11_attempt1.png';
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const uri = `data:image/jpeg;base64,${base64}`;

        const prompt = `IDENTITY LOCK: Preserve exact face, PRESERVE FACIAL PIERCINGS EXACTLY AS SHOWN IN THE REFERENCE (nose ring, ear piercings, etc), choker collar, hourglass body proportions, skin tone, pencil-thin microlocs updo, silver hand jewelry. EXPLICIT INSTRUCTION: Clear, well-defined, undistorted eyes matching the reference image's eye rendering perfectly. NO GOLD. TATTOOS: Bold black ink. ANKLES: Dangly silver bracelets. KIMONO: Furisode-style wide sleeves, black with red interior and pink cherry blossoms. SANDALS: Perfectly matching, symmetrical tall platform geta with two teeth. ART STYLE: Painterly/illustrated digital art style, matching the reference image perfectly. ABSOLUTELY NO PHOTOREALISM. ASPECT RATIO FRAMING: This is a 9:16 portrait image. Ensure the avatar and key scene elements remain well-composed and are not cropped awkwardly at this taller/wider framing. ACTION AND SCENE: ${customScene}`;

        console.log(`[${roomName}] Making request to Replicate API (9:16 aspect ratio)...`);

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
                    aspect_ratio: '9:16',
                    output_format: 'png',
                    resolution: '2K'
                }
            })
        });

        let data = await res.json();
        const jsonOut = `replicate_raw_response_part3_916_${roomName}.json`;
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
            const outPath = `public/assets/avatar-tests/part3_916_${roomName}.png`;
            fs.writeFileSync(outPath, Buffer.from(buffer));
            console.log(`[${roomName}] Saved output to ${outPath}`);
        } else if (data.status === 'failed') {
            console.log(`[${roomName}] Failed! Error: ${data.error}`);
        }
    } catch (e) {
        console.error(`[${roomName}] Error:`, e);
    }
}

async function main() {
    const rooms = [
        { name: 'mortal_rites', scene: 'Mortal Rites ritual room. The character is standing gracefully in the center of a beautiful traditional Japanese manor room, wooden floor, shoji screens, dim lantern light, holding a silver chalice.' },
        { name: 'grimoire', scene: 'Grimoire study. The character is seated gracefully at a low wooden writing desk, actively writing on an antique scroll. The setting is a dark-wood study/library within a traditional Japanese manor, tatami mats, leather-bound tomes and scrolls scattered, warm lantern light.' },
        { name: 'altars', scene: 'Altars shrine. The character is standing reverently before a traditional wooden altar. The setting is a formal shrine room within a Japanese manor, thick with incense smoke, highly concentrated glowing candles, ancestral and witchy focal points.' },
        { name: 'rootwork', scene: 'Rootwork apothecary. The character is actively grinding herbs in a mortar and pestle. The setting is an apothecary/stillroom styled with Japanese wooden tansu cabinetry, hanging dried herbs, glass vials, moody witchy lighting.' },
        { name: 'scrying_pool', scene: 'Scrying Pool. Deeply gothic-witchy aesthetic! The character is gazing intently down into a dark indoor reflecting basin. The setting is viewed from the wooden veranda of a Japanese manor, highly dramatic lighting, dark water reflections, floating candles, ritual objects, deeper shadows, extremely moody atmosphere.' },
        { name: 'shadow_tome', scene: 'Shadow Tome reading. The character is seated in a cozy, intimate reading nook, holding an open ancient book. A traditional Japanese-style ceramic teacup sits nearby, consistent with drinking tea while reading. The setting features dark wood, shadows, lit primarily by a single traditional glowing floor lantern.' },
        { name: 'manor_exterior', scene: 'Manor Exterior establishing shot. The character is standing outside on the wooden steps of the veranda, looking out into the night. The setting is a grand, large traditional Japanese-style mansion/manor set deep in a dark, mysterious forest at night, glowing with warm lantern light, witchy-wealthy-recluse atmosphere.' }
    ];

    for (const room of rooms) {
        await runPrompt(room.name, room.scene);
    }
}

main();
