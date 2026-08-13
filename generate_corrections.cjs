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
                execSync(`git commit -m "Regenerate ${filename} with corrections"`);
                execSync(`git push origin main`);
                console.log(`Committed and pushed ${filename} to git.`);
            } catch (e) {
                console.log("Git commit/push output:", e.message);
            }
            success = true;
        } else {
            console.error("Failed to generate:", data);
            break;
        }
    }
}

const baseCharacter = "Cartoony painterly cel-shaded 2D illustration. A wealthy, refined curvy plus-size woman (proportioned close to 5'8\", 256 lbs — fuller and curvier), elegant and well-kept. Skin: deep umber-brown. Eyes: natural-looking red eyes, normal white sclera. Face piercings: septum ring, nostril studs, eyebrow rings, two lip studs near the corners, left ear industrial bar plus cartilage stud, stretched earlobe with a gauge. ALL SILVER METALS. CRUCIAL DETAIL: The skin between the eyebrows MUST be completely plain and bare. Absolutely NO piercings, gems, or marks between the eyebrows. Only two lip studs located precisely below the lower lip near the corners, with absolutely NO third piercing in the center of the lips. ";

const tasks = [
    // 1. Space buns correction
    { prompt: baseCharacter + "Hair: shoulder-length micro locs explicitly styled into TWO distinct, separate round space buns sitting on top of the head (one on the left, one on the right). Not a single bun. Wearing a Wine Red dress.", file: "swatch_hair_spacebuns" },
    
    // 2. Robe variety (different silhouettes, embroidery, etc) and wide framing for short robes
    { prompt: baseCharacter + "Wearing a stunning red full-length flowing silk robe with a structured high collar, attached dramatic cape, and heavy ornate silver embroidery on the chest. Framing: waist up.", file: "swatch_robe_red" },
    { prompt: baseCharacter + "Wearing a wine-red short asymmetric hemline tunic robe, light silver embroidery, wide open neckline. Framing: mid-thigh to full body, standing pose.", file: "swatch_robe_short_wine" },
    { prompt: baseCharacter + "Wearing a black heavy flowing silk short robe dress, structured bustier top, sheer silk sleeves. Framing: mid-thigh to full body, standing pose.", file: "swatch_robe_short_black" },

    // 3. Shoes (wide framing, stripper-heel aesthetic)
    { prompt: baseCharacter + "Wearing an elegant, sleek pole-dance stripper-aesthetic high heels, very tall stiletto heel and platform. Framing: mid-thigh to full body to clearly show the shoes and legs.", file: "swatch_shoes_heels" },
    { prompt: baseCharacter + "Wearing elegant over-the-knee sleek patent pole-dance boots, extreme high stiletto heel, tasteful going-out style, no buckles, no moto aesthetic. Framing: mid-thigh to full body to clearly show the boots and legs.", file: "swatch_shoes_tall_boots" },

    // 4. Hair Colors (drop blue, add natural + two-tone)
    { prompt: baseCharacter + "Hair: shoulder-length micro locs colored in a rich natural ginger tone. Wearing a Wine Red dress.", file: "swatch_haircolor_ginger" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs colored in a natural dark brunette tone. Wearing a Wine Red dress.", file: "swatch_haircolor_brunette" },
    { prompt: baseCharacter + "Hair: shoulder-length micro locs colored in a striking two-toned dual-color style (half red, half black). Wearing a Wine Red dress.", file: "swatch_haircolor_twotone" }
];

async function run() {
    for (const t of tasks) {
        await generateNanoBanana(t.prompt, t.file);
        console.log("Waiting 12 seconds between generations...");
        await new Promise(r => setTimeout(r, 12000));
    }
}

run();
