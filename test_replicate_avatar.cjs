const fs = require('fs');

async function testReplicate() {
    try {
        const tokenStr = fs.readFileSync('.env').toString();
        const tokenLine = tokenStr.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN='));
        if (!tokenLine) throw new Error("REPLICATE_API_TOKEN not found in .env");
        const token = tokenLine.split('=')[1].trim();

        const img1Path = 'C:/Users/purpl/.gemini/antigravity/brain/0be76408-6bc5-4ff5-a2bb-20a516df3f62/internal_avatar_corrected_1786659423144.jpg';

        const base64_1 = fs.readFileSync(img1Path).toString('base64');
        const uri1 = `data:image/jpeg;base64,${base64_1}`;

        const prompt = "Keep this exact character's face, skin tone, body proportions, black-and-silver crane kimono, and pose identical to the foundation image. Only make these targeted edits: 1. Show the full body including the feet, with tall elevated geta sandals visible (wooden platform soles). 2. Make the hair pencil-thin shoulder-length microlocs styled into a traditional updo with hanging kanzashi ornaments. Keep everything else strictly locked.";

        console.log("Making request to Replicate API...");

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
                    image_input: [uri1],
                    aspect_ratio: '1:1',
                    output_format: 'png',
                    resolution: '2K'
                }
            })
        });

        let data = await res.json();
        fs.writeFileSync('replicate_raw_response.json', JSON.stringify(data, null, 2));
        
        while (data.status === 'starting' || data.status === 'processing') {
            console.log(`Status: ${data.status}... waiting 3s`);
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            data = await pollRes.json();
            fs.writeFileSync('replicate_raw_response.json', JSON.stringify(data, null, 2));
        }

        console.log(`Prediction status: ${data.status}`);
        if (data.status === 'succeeded' && data.output) {
            console.log(`Success! Output URL: ${data.output}`);
            const imageRes = await fetch(data.output);
            const buffer = await imageRes.arrayBuffer();
            const outPath = 'public/assets/avatar-tests/nano_banana_avatar_test.png';
            fs.writeFileSync(outPath, Buffer.from(buffer));
            console.log(`Saved output to ${outPath}`);
        } else if (data.status === 'failed') {
            console.log(`Failed! Error: ${data.error}`);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testReplicate();
