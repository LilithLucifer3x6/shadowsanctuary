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
    
    const ref1 = getBase64URI('C:/Users/purpl/.gemini/antigravity/brain/1370394e-3b85-4504-bb15-db9d1cd803c0/.user_uploaded/media_1786579042327.jpg');
    const ref2 = getBase64URI('C:/Users/purpl/.gemini/antigravity/brain/1370394e-3b85-4504-bb15-db9d1cd803c0/.user_uploaded/media_1786579042338.jpg');

    let success = false;
    let attempts = 0;
    while (!success && attempts < 3) {
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
                    execSync(`git commit -m "Add ${filename} swatch"`);
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
                await new Promise(r => setTimeout(r, 5000));
            }
        } catch (e) {
            console.error("Exception during fetch:", e);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

const baseCharacter = `Japanese animation art style in the vein of Castlevania (Netflix series), Soul Eater, and Studio Ghibli films — painterly digital illustration, clean confident line art, cel-shaded coloring with soft gradient shading, moody atmospheric lighting, realistic facial proportions, rich color palette. Not photorealistic, not comic-book pinup, not children's cartoon. A sexy, gothic, bold, confident plus-size woman (proportioned close to 5'8", 256 lbs — fuller and curvier, NOT pregnant-looking, bust large but realistic F-G cup, not exaggerated). Pole-dance aesthetic, body-confident silhouettes, sultry attitude. Skin: rich, deep umber-brown, like dark roast coffee with a small amount of cream. Eyes: natural-looking red irises with normal white sclera — NOT glowing orbs. Nails: long, pointed stiletto-shaped, coordinated to outfit. Tattoos: witchy-style tattoos on hands/arms/legs/chest, NO face tattoos. Face piercings: septum ring, stud in each nostril, eyebrow ring on the outer tail of each brow, two small lip studs below the lower lip near the corners (snake bites) and NOTHING else on the lips, left ear industrial bar plus cartilage stud plus a piercing near the earlobe gauge (standard 00). Metals: strictly silver/white gold/platinum, NEVER gold. CRUCIAL DETAIL: The skin between the eyebrows MUST be completely plain and bare. Absolutely NO piercings, gems, or marks between the eyebrows. `;

const tasks = [
    // === ROBES (Need 6 more for 10 total) ===
    { prompt: baseCharacter + "Wearing a sexy, revealing kimono-style robe in deep red silk, wide dramatic sleeves, dangerously low neckline, wrapped tightly at the waist with a dark sash. Framing: mid-thigh to full body, standing pose.", file: "swatch_robe_kimono_red" },
    { prompt: baseCharacter + "Wearing a black heavy flowing silk short dress, structured bodice top, sheer silk dark sleeves. Framing: mid-thigh to full body, standing pose.", file: "swatch_robe_short_black_lace" },
    { prompt: baseCharacter + "Wearing a dark purple bodysuit with a silver gothic harness and a sheer flowing open skirt. Framing: mid-thigh to full body, standing pose.", file: "swatch_robe_harness_purple" },
    { prompt: baseCharacter + "Wearing a black silk brocade dress with high thigh slits, sultry attitude. Framing: mid-thigh to full body, standing pose.", file: "swatch_robe_brocade_split" },
    { prompt: baseCharacter + "Wearing a dark purple short robe with spiderweb silver embroidery, sweetheart neckline. Framing: mid-thigh to full body, standing pose.", file: "swatch_robe_spiderweb" },
    { prompt: baseCharacter + "Wearing a red gothic corset top with a flowing sheer asymmetrical short skirt. Framing: mid-thigh to full body, standing pose.", file: "swatch_robe_corset_red" },

    // === HAIRSTYLES (Need 4 more for 10 total) ===
    { prompt: baseCharacter + "Hair: shoulder-length micro locs styled into an elegant braided crown halo. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_hair_braided_crown" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs gathered into a dramatic high ponytail. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_hair_high_ponytail" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs loosely gathered into a sultry messy bun with face-framing tendrils. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_hair_messy_bun" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs pinned up into a bold faux-hawk style. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_hair_mohawk_style" },

    // === JEWELRY (Need 6 more for 10 total) ===
    { prompt: baseCharacter + "Jewelry focus: Multiple layered silver chains resting on the chest. Paired with a plunging neckline black silk dress. The jewelry physically makes sense with the neckline. Framing: chest up.", file: "swatch_jewelry_silver_chains" },
    { prompt: baseCharacter + "Jewelry focus: Large silver gothic cross pendant on a thick chain. Paired with a high-collar red robe, the pendant resting over the fabric. Framing: chest up.", file: "swatch_jewelry_gothic_cross" },
    { prompt: baseCharacter + "Jewelry focus: Silver crescent moon choker. Paired with a wide open off-the-shoulder purple top. Framing: chest up.", file: "swatch_jewelry_crescent_moon" },
    { prompt: baseCharacter + "Jewelry focus: Large silver spider brooch pinning a cape. Paired with a dark red flowing robe. Framing: chest up.", file: "swatch_jewelry_spider_brooch" },
    { prompt: baseCharacter + "Jewelry focus: Silver snake armband wrapping around the bicep. Paired with a sleeveless black dress. Framing: waist up.", file: "swatch_jewelry_snake_armband" },
    { prompt: baseCharacter + "Jewelry focus: Multiple silver hair cuffs woven heavily through her locs. Paired with a wine red dress. Framing: chest up.", file: "swatch_jewelry_hair_cuffs" },
    { prompt: baseCharacter + "Jewelry focus: Intricate silver hand harness and multiple rings on her fingers. Paired with a sheer-sleeved dark purple dress. Framing: waist up, hands visible.", file: "swatch_jewelry_hand_harness" },

    // === HAIR COLORS (Need 4 more for 9 total) ===
    { prompt: baseCharacter + "Hair color: Deep dark cherry red micro locs. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_haircolor_darkcherry" },
    { prompt: baseCharacter + "Hair color: Vibrant copper auburn micro locs. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_haircolor_copper" },
    { prompt: baseCharacter + "Hair color: Jet black raven micro locs. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_haircolor_raven" },
    { prompt: baseCharacter + "Hair color: Striking skunk-stripe two-toned hair, black with a thick silver streak. Wearing a Wine Red dress. Framing: chest up.", file: "swatch_haircolor_skunkstripe" },

    // === SHOES (Need 2 more for 4 total + 1 ankle bracelet) ===
    { prompt: baseCharacter + "Shoes focus: Sleek patent leather thigh-high pole-dance boots with extreme stiletto heels. Framing: mid-thigh to full body, clearly showing the boots. Wearing a short black dress.", file: "swatch_shoes_thigh_high_boots" },
    { prompt: baseCharacter + "Shoes focus: Elegant strappy stiletto heels wrapping up the calf, pole-dance pleaser style. Framing: mid-thigh to full body, clearly showing the shoes. Wearing a short purple dress.", file: "swatch_shoes_strappy_heels" },
    { prompt: baseCharacter + "Shoes focus: Very high platform stiletto pumps. Framing: mid-thigh to full body, clearly showing the shoes. Wearing a short red dress. Also wearing one delicate silver ankle bracelet on one ankle.", file: "swatch_shoes_platform_pumps" }
];

async function run() {
    for (const t of tasks) {
        await generateNanoBanana(t.prompt, t.file);
        console.log("Waiting 12 seconds between generations...");
        await new Promise(r => setTimeout(r, 12000));
    }
}

run();
