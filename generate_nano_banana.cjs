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
    // BATCH 2: Hair Colors (using standard shoulder-length micro locs)
    { prompt: baseCharacter + "Hair: shoulder-length micro locs, colored pure silver/white. Wearing a dark romantic silhouette robe with rich silver embroidery, structured high collars, dramatic wide sleeves.", file: "swatch_haircolor_silver" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs, colored deep wine burgundy. Wearing a dark romantic silhouette robe with rich silver embroidery, structured high collars, dramatic wide sleeves.", file: "swatch_haircolor_burgundy" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs, colored forest green. Wearing a dark romantic silhouette robe with rich silver embroidery, structured high collars, dramatic wide sleeves.", file: "swatch_haircolor_green" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs, colored midnight blue. Wearing a dark romantic silhouette robe with rich silver embroidery, structured high collars, dramatic wide sleeves.", file: "swatch_haircolor_blue" },

    // BATCH 3: Robes (Full length, dark romantic silhouette, structured high collars, dramatic wide sleeves)
    { prompt: baseCharacter + "Hair: shoulder-length micro locs, black. Wearing a Midnight Black robe with subtle dark silver embroidery, structured high collars, dramatic wide sleeves, dark romantic silhouette.", file: "swatch_robe_black" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs, black. Wearing an Obsidian robe with HEAVY ornate silver embroidery, structured high collars, dramatic wide sleeves, dark romantic silhouette.", file: "swatch_robe_obsidian_heavy" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs, black. Wearing a Royal Purple robe with rich silver embroidery, structured high collars, dramatic wide sleeves, dark romantic silhouette.", file: "swatch_robe_purple" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs, black. Wearing an Emerald Green robe with rich silver embroidery, structured high collars, dramatic wide sleeves, dark romantic silhouette.", file: "swatch_robe_green" }
];

async function run() {
    for (const t of tasks) {
        await generateNanoBanana(t.prompt, t.file);
        console.log("Waiting 12 seconds between generations...");
        await new Promise(r => setTimeout(r, 12000));
    }
}

run();
