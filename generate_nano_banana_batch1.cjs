const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function getBase64URI(filePath) {
    const ext = path.extname(filePath).substring(1);
    const data = fs.readFileSync(filePath, 'base64');
    return `data:image/${ext};base64,${data}`;
}

async function generateNanoBanana(prompt, filename) {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const token = envContent.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN')).split('=')[1].trim();

    console.log(`Starting generation for ${filename}...`);
    
    // The two reference images
    const ref1 = getBase64URI('C:/Users/purpl/.gemini/antigravity/brain/1370394e-3b85-4504-bb15-db9d1cd803c0/.user_uploaded/media_1786579042327.jpg');
    const ref2 = getBase64URI('C:/Users/purpl/.gemini/antigravity/brain/1370394e-3b85-4504-bb15-db9d1cd803c0/.user_uploaded/media_1786579042338.jpg');

    let success = false;
    while (!success) {
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
                    image_input: [ref1, ref2],
                    aspect_ratio: '1:1',
                    output_format: 'png',
                    resolution: '2K'
                }
            })
        });

        const data = await res.json();
        
        if (res.status === 429) {
            console.log("Rate limited. Waiting 10 seconds...");
            await new Promise(r => setTimeout(r, 10000));
            continue;
        }

        if (data.status === 'succeeded') {
            const imageUrl = data.output;
            console.log(`Success! Downloading image from ${imageUrl}`);
            const imageRes = await fetch(imageUrl);
            const buffer = await imageRes.arrayBuffer();
            const outPath = `public/assets/avatar-tests/${filename}.png`;
            fs.writeFileSync(outPath, Buffer.from(buffer));
            console.log(`Saved to ${outPath}`);
            
            // Push to git
            try {
                execSync(`git add "${outPath}"`);
                execSync(`git commit -m "Replace ${filename} with nano-banana-pro"`);
                execSync(`git push origin main`);
                console.log(`Committed and pushed ${filename} to git.`);
            } catch (e) {
                console.error("Git commit/push failed:", e.message);
            }
            success = true;
        } else {
            console.error("Failed to generate:", data);
            break;
        }
    }
}

const baseCharacter = "Cartoony painterly cel-shaded 2D illustration. A wealthy, refined curvy plus-size woman (proportioned close to 5'8\", 256 lbs — fuller and curvier), elegant and well-kept. Skin: deep umber-brown. Eyes: natural-looking red eyes, normal white sclera. Face piercings: septum ring, nostril studs, eyebrow rings, two lip studs near the corners, left ear industrial bar plus cartilage stud, stretched earlobe with a gauge. ALL SILVER METALS. ";

const tasks = [
    // BATCH 1: Hairstyles (replacing the previous imagen-3 ones)
    { prompt: baseCharacter + "Hair: shoulder-length micro locs swept entirely over one shoulder. Wearing a Wine Red dress.", file: "swatch_hair_sideswept" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs pulled back tightly into an elegant low bun at the nape of the neck. Wearing a Wine Red dress.", file: "swatch_hair_pulledback" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs styled into intricate space buns on top of her head. Wearing a Wine Red dress.", file: "swatch_hair_spacebuns" }
];

async function run() {
    for (const t of tasks) {
        await generateNanoBanana(t.prompt, t.file);
        console.log("Waiting 12 seconds between generations...");
        await new Promise(r => setTimeout(r, 12000));
    }
}

run();
