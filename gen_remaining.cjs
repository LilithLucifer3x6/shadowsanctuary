const fs = require('fs');

async function runPrompt(roomName, customScene, retries = 3) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        const imgPath = `public/assets/avatar-tests/part3_916_${roomName}.png`;
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const uri = `data:image/png;base64,${base64}`;

        const prompt = `LANDSCAPE FULL-BODY SHOT WITH EXTRA VERTICAL MARGIN — the entire character must be visible from head to feet including geta sandals. CRITICAL FRAMING REQUIREMENT: Pull the camera back further than usual to ensure significant empty space/margin above the hair ornaments and below the sandal feet. The hair and feet must NOT touch or be near the top or bottom edges. Camera pulled back to show the full figure AND the surrounding scene. IDENTITY LOCK: Preserve exact face, PROMINENT NOSE RING AND MULTIPLE EAR PIERCINGS EXACTLY AS SHOWN IN THE REFERENCE, choker collar, plus-size hourglass body, deep umber skin tone, pencil-thin microlocs updo with kanzashi ornaments, silver hand jewelry. Eyes: clear, well-defined, undistorted, matching reference exactly. NO GOLD. TATTOOS: Bold black ink. ANKLES: Dangly silver bracelets. KIMONO: Furisode-style wide sleeves, black with red interior and pink cherry blossoms. SANDALS: Perfectly symmetrical tall platform geta with two teeth. ART STYLE: Painterly/illustrated digital art, matching reference style — ABSOLUTELY NO PHOTOREALISM. FRAMING: 16:9 landscape canvas. The character is centered or slightly off-center, the wider canvas reveals more of the surrounding scene to the left and right — do NOT crop the figure. CRITICAL CONSTRAINT: Character must be actively engaged in the described action, face turned away from or not directly facing the camera/viewer — candid in-action framing, not a posed portrait looking at the camera. ACTION AND SCENE: ${customScene}`;

        console.log(`[${roomName}] Sending to google/nano-banana-pro (16:9)...`);

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
        
        let attempts = 0;
        while ((data.status === 'starting' || data.status === 'processing') && attempts < 40) { // max 2 mins
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            data = await pollRes.json();
            attempts++;
        }

        if (attempts >= 40) {
            console.log(`[${roomName}] Timed out. Canceling prediction.`);
            await fetch(`https://api.replicate.com/v1/predictions/${data.id}/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (retries > 0) return await runPrompt(roomName, customScene, retries - 1);
            return false;
        }

        console.log(`[${roomName}] Final status: ${data.status}`);

        if (data.status === 'succeeded' && data.output) {
            const imageRes = await fetch(data.output);
            const buffer = await imageRes.arrayBuffer();
            const outPath = `public/assets/avatar-tests/part5_169_action_${roomName}.png`;
            fs.writeFileSync(outPath, Buffer.from(buffer));
            console.log(`[${roomName}] Saved to ${outPath}`);
            return true;
        } else if (data.status === 'failed') {
            console.log(`[${roomName}] FAILED. Error: ${data.error}`);
            if (retries > 0) {
                console.log(`[${roomName}] Retrying... (${retries} retries left)`);
                await new Promise(r => setTimeout(r, 5000));
                return await runPrompt(roomName, customScene, retries - 1);
            }
        }
        return false;
    } catch (e) {
        console.error(`[${roomName}] Error:`, e);
        return false;
    }
}

async function main() {
    const rooms = [
        { name: 'grimoire', scene: 'Actively writing on a scroll or turning a page, eyes on the page/desk, not looking up. Intimate study room in a Japanese gothic manor, heavy dark wood writing desk, lit by tall black candles, scattered scrolls, inkstones, and thick bound books. Shadowy, academic atmosphere.' },
        { name: 'altars', scene: 'Kneeling in prayer/ritual at the altar, head bowed or eyes on the candles/offerings, not facing forward. Sacred offering space in a Japanese gothic manor, dark wood shrine, glowing incense smoke, black candles, small brass offering bowls, and dried flowers. Spiritual and reverent atmosphere.' },
        { name: 'rootwork', scene: 'Actively grinding herbs, measuring, or working with bottles at the workbench, focused on the task, not looking up. Botanical processing workbench in a Japanese gothic manor, cluttered with dried herbs, glass vials, brass scales, and a mortar and pestle. Earthy and alchemical atmosphere.' },
        { name: 'scrying_pool', scene: 'Leaning over the water, gazing down into the reflection, not at the viewer. A quiet, mystical reflection pool built of dark stone inside a Japanese gothic manor, lily pads, glowing faintly with ethereal light. Serene and supernatural atmosphere.' },
        { name: 'shadow_tome', scene: 'Reading the open book, eyes on the page, holding a teacup. A cozy but dark library corner in a Japanese gothic manor, filled with floor-to-ceiling dark bookshelves, resting on a velvet cushion.' },
        { name: 'manor_exterior', scene: 'An establishing/atmospheric shot, not a portrait. The character is walking away or seen from behind in profile, looking out into the woods rather than at the camera. A grand Japanese gothic manor nestled deep in a dense, misty, ancient forest. Dark timber, steep tiled roofs, mossy stone paths, and glowing paper lanterns.' }
    ];

    for (const room of rooms) {
        console.log(`\n=== Generating ${room.name} ===`);
        const success = await runPrompt(room.name, room.scene);
        if (!success) {
            console.log(`Failed to generate ${room.name}`);
        }
        await new Promise(r => setTimeout(r, 2000));
    }
}

main();
