const fs = require('fs');

async function runPrompt(roomName, customScene, retries = 20) {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        const token = tokenLine.split('=')[1].trim();

        // Use the final locked reference image for this room
        const imgPath = `public/assets/avatar-tests/part3_916_${roomName}.png`;
        const base64 = fs.readFileSync(imgPath).toString('base64');
        const uri = `data:image/png;base64,${base64}`;

        const prompt = `LANDSCAPE FULL-BODY SHOT — the entire character must be visible from head to feet including geta sandals, with clear space above and below. Camera pulled back to show the full figure AND the surrounding scene. IDENTITY LOCK: Preserve exact face, PRESERVE FACIAL PIERCINGS EXACTLY AS SHOWN IN THE REFERENCE (nose ring, ear piercings), choker collar, plus-size hourglass body, deep umber skin tone, pencil-thin microlocs updo with kanzashi ornaments, silver hand jewelry. Eyes: clear, well-defined, undistorted, matching reference exactly. NO GOLD. TATTOOS: Bold black ink. ANKLES: Dangly silver bracelets. KIMONO: Furisode-style wide sleeves, black with red interior and pink cherry blossoms. SANDALS: Perfectly symmetrical tall platform geta with two teeth. ART STYLE: Painterly/illustrated digital art, matching reference style — ABSOLUTELY NO PHOTOREALISM. FRAMING: 16:9 landscape canvas. The character is centered or slightly off-center, the wider canvas reveals more of the surrounding Japanese gothic manor-in-the-woods scene to the left and right — do NOT crop the figure. ACTION AND SCENE: ${customScene}`;

        console.log(`[${roomName}] Sending to google/nano-banana-pro (16:9, image_input: part3_916_${roomName}.png)...`);
        console.log(`[${roomName}] Prompt length: ${prompt.length} chars`);

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
        const jsonOut = `part4_raw_response_${roomName}.json`;
        fs.writeFileSync(jsonOut, JSON.stringify(data, null, 2));
        console.log(`[${roomName}] Initial response status: ${data.status}`);

        // Poll until complete
        while (data.status === 'starting' || data.status === 'processing') {
            console.log(`[${roomName}] Polling... (status: ${data.status})`);
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            data = await pollRes.json();
            fs.writeFileSync(jsonOut, JSON.stringify(data, null, 2));
        }

        console.log(`[${roomName}] Final status: ${data.status}`);

        if (data.status === 'succeeded' && data.output) {
            const imageRes = await fetch(data.output);
            const buffer = await imageRes.arrayBuffer();
            const outPath = `public/assets/avatar-tests/part4_169_${roomName}.png`;
            fs.writeFileSync(outPath, Buffer.from(buffer));
            console.log(`[${roomName}] Saved to ${outPath}`);
            console.log(`[${roomName}] Raw JSON saved to ${jsonOut}`);
        } else if (data.status === 'failed') {
            console.log(`[${roomName}] FAILED. Error: ${data.error}`);
            if (data.error && data.error.includes('ModelRateLimitError') && retries > 0) {
                console.log(`[${roomName}] Rate limit. Waiting 30s... (${retries} retries left)`);
                await new Promise(r => setTimeout(r, 30000));
                return await runPrompt(roomName, customScene, retries - 1);
            }
        }
    } catch (e) {
        console.error(`[${roomName}] Error:`, e);
    }
}

runPrompt(
    'mortal_rites',
    'Japanese gothic vanity and washroom ritual. The character is performing her skincare routine at an ornate dark stone basin set into a lacquered wooden vanity, surrounded by ceramic apothecary jars, rolled cloth, and paper-screen shoji windows casting dim moonlight. The setting is interior, Japanese gothic manor aesthetic, intimate and candlelit.'
);
