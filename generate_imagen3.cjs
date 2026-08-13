const fs = require('fs');

async function generateImagen3(prompt, filename) {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const token = envContent.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN')).split('=')[1].trim();

    console.log(`Starting generation for ${filename}...`);
    const res = await fetch('https://api.replicate.com/v1/models/google/imagen-3/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait'
        },
        body: JSON.stringify({
            input: {
                prompt,
                aspect_ratio: '1:1',
                output_format: 'png'
            }
        })
    });

    const data = await res.json();
    
    if (data.status === 'succeeded') {
        const imageUrl = data.output;
        console.log(`Success! Downloading image from ${imageUrl}`);
        const imageRes = await fetch(imageUrl);
        const buffer = await imageRes.arrayBuffer();
        fs.writeFileSync(`public/assets/avatar-tests/${filename}.png`, Buffer.from(buffer));
        console.log(`Saved to ${filename}.png`);
    } else {
        console.error("Failed to generate:", data);
    }
}

const basePrompt = "Cartoony painterly cel-shaded 2D illustration. A wealthy, refined curvy plus-size woman, elegant and well-kept. Skin: deep umber-brown. Eyes: red irises, normal white sclera. Face piercings: septum ring, nostril studs, eyebrow rings, two lip studs near the corners, left ear industrial bar plus cartilage stud, stretched earlobe with a gauge. ALL SILVER METALS. Wearing a wine-red dress. Plain background. ";

const tasks = [
    { prompt: basePrompt + "Hair: shoulder-length micro locs swept entirely over one shoulder.", file: "swatch_hair_sideswept" },
    { prompt: basePrompt + "Hair: shoulder-length micro locs pulled back tightly into an elegant low bun at the nape of the neck.", file: "swatch_hair_pulledback" },
    { prompt: basePrompt + "Hair: shoulder-length micro locs styled into intricate space buns on top of her head.", file: "swatch_hair_spacebuns" }
];

async function run() {
    for (const t of tasks) {
        await generateImagen3(t.prompt, t.file);
        // Wait 12 seconds to avoid rate limits
        console.log("Waiting 12 seconds for rate limits...");
        await new Promise(r => setTimeout(r, 12000));
    }
}

run();
