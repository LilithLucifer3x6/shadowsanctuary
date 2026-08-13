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
    
    // LOCKED REFERENCE IMAGE for Character Consistency
    const ref1 = getBase64URI('C:/Users/purpl/shadowsanctuary/public/assets/avatar-tests/swatch_robe_kimono_red.png');

    let success = false;
    let attempts = 0;
    while (!success && attempts < 10) { 
        attempts++;
        try {
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
                        image_input: [ref1],
                        aspect_ratio: '1:1',
                        output_format: 'png',
                        resolution: '2K',
                        seed: 1337 // Fixed seed for character consistency
                    }
                })
            });

            const data = await res.json();
            
            if (res.status === 429 || (data.error && data.error.includes("ModelRateLimitError"))) {
                console.log(`Rate limited on attempt ${attempts}. Waiting 20 seconds...`);
                await new Promise(r => setTimeout(r, 20000));
                continue;
            }

            if (data.status === 'succeeded' && data.output) {
                const imageUrl = data.output;
                console.log(`Success! Downloading image from ${imageUrl}`);
                const imageRes = await fetch(imageUrl);
                const buffer = await imageRes.arrayBuffer();
                const outPath = `public/assets/avatar-tests/${filename}.png`;
                fs.writeFileSync(outPath, Buffer.from(buffer));
                console.log(`Saved to ${outPath}`);
                
                // Push to git immediately
                try {
                    execSync(`git add "${outPath}"`);
                    execSync(`git commit -m "Update ${filename} swatch"`);
                    execSync(`git push origin main`);
                    console.log(`Committed and pushed ${filename} to git.`);
                } catch (e) {
                    console.log("Git commit/push output:", e.message);
                }
                success = true;
            } else {
                console.error("Failed to generate:", data.error || data);
                if (data.error && data.error.includes("sensitive")) {
                    console.log("Skipping due to sensitive content filter.");
                    break;
                }
                console.log("Waiting 10 seconds before retry...");
                await new Promise(r => setTimeout(r, 10000));
            }
        } catch (e) {
            console.error("Exception during fetch:", e.message);
            console.log("Waiting 10 seconds before retry...");
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

const baseCharacter = `Japanese animation art style in the vein of Castlevania (Netflix series), Soul Eater, and Studio Ghibli films — painterly digital illustration, clean confident line art, cel-shaded coloring with soft gradient shading, moody atmospheric lighting, realistic facial proportions, rich color palette. Not photorealistic, not comic-book pinup, not children's cartoon. A sexy, gothic, bold, confident plus-size woman (proportioned close to 5'8", 256 lbs — fuller and curvier, NOT pregnant-looking, bust large but realistic F-G cup, not exaggerated). Pole-dance aesthetic, body-confident silhouettes, sultry attitude. Skin: rich, deep umber-brown, like dark roast coffee with a small amount of cream. Eyes: natural-looking red irises with normal white sclera — NOT glowing orbs. Nails: long, pointed stiletto-shaped, coordinated to outfit. Tattoos: witchy-style tattoos on hands/arms/legs/chest, NO face tattoos. Face piercings: septum ring, stud in each nostril, eyebrow ring on the outer tail of each brow, two small lip studs below the lower lip near the corners (snake bites) and NOTHING else on the lips, left ear industrial bar plus cartilage stud plus a piercing near the earlobe gauge (standard 00). Metals: strictly silver/white gold/platinum, NEVER gold. CRUCIAL DETAIL: The skin between the eyebrows MUST be completely plain and bare. Absolutely NO piercings, gems, or marks between the eyebrows. CRUCIAL HAIR TEXTURE DETAIL: Hair texture MUST be identical across all styles: shoulder-length micro locs, thin and tightly coiled. `;

const tasks = [
    // === HAIRSTYLES (5 new + 3 fixes = 8 total) ===
    { prompt: baseCharacter + "Hair: TWO separate round buns, one positioned high above EACH ear (left ear and right ear), NOT a single bun, NOT hair pulled back into one low bun. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_hair_spacebuns" },
    { prompt: baseCharacter + "Hair: Edgy side undercut, one side of the head shaved short, with long thick hair swept heavily to the opposite side. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_hair_undercut" },
    { prompt: baseCharacter + "Hair: Sleek, bone-straight long hair parted directly down the middle, falling past the shoulders. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_hair_long_straight" },
    { prompt: baseCharacter + "Hair: Stylized bantu knots uniformly patterned entirely across the head. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_hair_bantu_knots" },
    { prompt: baseCharacter + "Hair: A sharp, crisp chin-length bob haircut with natural loose waves. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_hair_wavy_bob" },
    { prompt: baseCharacter + "Hair: A single thick, long braided ponytail resting over one shoulder. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_hair_long_braid" },
    
    // === HAIR COLORS (Retries) ===
    { prompt: baseCharacter + "Hair color: Deep dark cherry red micro locs. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_haircolor_darkcherry" },
    { prompt: baseCharacter + "Hair color: Bright, striking icy platinum blonde micro locs. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_haircolor_icyblonde" }
];

async function run() {
    for (const t of tasks) {
        await generateNanoBanana(t.prompt, t.file);
        console.log("Waiting 12 seconds between generations...");
        await new Promise(r => setTimeout(r, 12000));
    }
}

run();
