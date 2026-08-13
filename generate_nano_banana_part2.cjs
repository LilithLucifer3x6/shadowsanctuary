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
                execSync(`git commit -m "Add ${filename} swatch"`);
                console.log(`Committed ${filename} to git.`);
            } catch (e) {
                console.error("Git commit failed:", e.message);
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
    // BATCH 4: Robes - Short
    { prompt: baseCharacter + "Hair: shoulder-length micro locs. Wearing a short knee-length Wine Red dress with an asymmetrical cut, structured high collar, and subtle silver accents.", file: "swatch_robe_short_wine" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs. Wearing a short knee-length Midnight Black dress, structured high collar, sleeveless but dramatic shoulders, rich silver embroidery.", file: "swatch_robe_short_black" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs. Wearing a short knee-length Emerald Green dress with an asymmetrical cut, structured high collar, heavy silver detailing.", file: "swatch_robe_short_green" },
    
    // BATCH 5: Jewelry (Focusing on chest/neck)
    { prompt: baseCharacter + "Hair: shoulder-length micro locs. Wearing a wine-red dress. Heavy layered silver chains with a large obsidian pendant necklace on her chest.", file: "swatch_jewelry_obsidian_pendant" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs. Wearing a wine-red dress. Delicate silver filigree choker necklace around her neck.", file: "swatch_jewelry_choker" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs. Wearing a wine-red dress. Thick structured silver gothic collar piece around her neck.", file: "swatch_jewelry_thick_collar" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs. Wearing a wine-red dress. Simple elegant silver chain with a ruby teardrop pendant necklace.", file: "swatch_jewelry_ruby_teardrop" },

    // BATCH 6: Shoes (Full body framing to show feet)
    { prompt: baseCharacter + "Full-body framing. Hair: shoulder-length micro locs. Wearing a wine-red dress. Tall black leather boots with heavy silver buckles.", file: "swatch_shoes_tall_boots" },
    { prompt: baseCharacter + "Full-body framing. Hair: shoulder-length micro locs. Wearing a wine-red dress. Elegant black velvet heels with silver accents.", file: "swatch_shoes_heels" },
    { prompt: baseCharacter + "Full-body framing. Hair: shoulder-length micro locs. Wearing a wine-red dress. Barefoot, wearing delicate silver ankle chains and toe rings.", file: "swatch_shoes_barefoot_chains" }
];

async function run() {
    for (const t of tasks) {
        await generateNanoBanana(t.prompt, t.file);
        console.log("Waiting 12 seconds between generations...");
        await new Promise(r => setTimeout(r, 12000));
    }
}

run();
