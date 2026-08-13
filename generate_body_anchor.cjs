const fs = require('fs');
const path = require('path');

async function generateAnchor(prompt, filename, seed) {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const token = envContent.split('\n').find(line => line.startsWith('REPLICATE_API_TOKEN')).split('=')[1].trim();

    console.log(`Generating anchor: ${filename} (seed ${seed})...`);
    
    let success = false;
    let attempts = 0;
    while (!success && attempts < 5) {
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
                        // NO image_input — working from text only so model must build body from scratch
                        aspect_ratio: '1:1',
                        output_format: 'png',
                        resolution: '2K',
                        seed
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
                console.log(`Success! Downloading from ${data.output}`);
                const imageRes = await fetch(data.output);
                const buffer = await imageRes.arrayBuffer();
                const outPath = `public/assets/avatar-tests/${filename}.png`;
                fs.writeFileSync(outPath, Buffer.from(buffer));
                console.log(`Saved to ${outPath}`);
                success = true;
            } else {
                console.error('Failed:', data.error || JSON.stringify(data));
                await new Promise(r => setTimeout(r, 10000));
            }
        } catch (e) {
            console.error('Exception:', e.message);
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}

// All four corrections applied:
// 1. CLOTHING: simple modest dark robe (not lingerie/nightwear/slip)
// 2. BRIDGE PIERCING: maximum-strength explicit negative, repeated
// 3. SKIN TONE: rich, deep umber-brown skin, like dark roast coffee with a small amount of cream
// 4. NOSTRIL: explicit "one tiny flat stud in EACH nostril, left and right, symmetrical"
const bodyFirstPrompt = `Japanese animation art style in the vein of Castlevania (Netflix series), Soul Eater, and Studio Ghibli films — painterly digital illustration, clean confident line art, cel-shaded coloring with soft gradient shading, moody atmospheric lighting, realistic facial proportions, rich color palette. Not photorealistic, not comic-book pinup, not children's cartoon.

SKIN TONE — CRITICAL: rich, deep umber-brown skin, like dark roast coffee with a small amount of cream.

BODY IS THE PRIORITY — THIS MUST READ AS 256 LBS ON A 5'8" FRAME: A genuinely fat plus-size woman. Visually heavy. Thick, heavy upper arms with visible soft flesh. Wide full shoulders. Very large bust — F-G cup, natural weight and droop, not cartoon perky. A visibly rounded soft belly that protrudes forward noticeably. Wide hips substantially wider than shoulders. Thick full thighs that press together. Heavy calves. The overall silhouette should be unmistakably plus-size — NOT hourglass model curvy, NOT "athletic thicc" — this is a heavy fat woman who carries weight across her whole body. Body-confident, sultry attitude, not apologetic.

OUTFIT: Wearing a simple, modest, loose-fitting full-length dark charcoal robe — not lingerie, not a slip dress, not nightwear. Just a plain robe so the body shape underneath is still readable.

FACE PIERCINGS — READ CAREFULLY AND FOLLOW EXACTLY:
- Septum ring (through the septum, bottom of the nose)
- ONE tiny flat stud in the LEFT nostril, and ONE tiny flat stud in the RIGHT nostril — symmetrical, one per side, small and flush, NOT a ring, NOT multiple studs per side
- Eyebrow ring on the OUTER TAIL of each eyebrow (not the inner part, not the middle — the far outer end of each brow)
- Two small lip studs BELOW the lower lip near the left and right corners (snake bites) — BELOW the lip, NOT on the lip itself, NOT in the middle
- Left ear: industrial bar piercing + cartilage stud + gauge near the earlobe

BRIDGE PIERCING — ABSOLUTE HARD RULE — ZERO EXCEPTIONS: There is ABSOLUTELY NO piercing, ring, stud, gem, or mark of any kind on the nose bridge or between the eyebrows. The nose bridge is bare plain skin. The area between the eyebrows is completely bare plain skin. No exceptions. No bridge piercing. No third eye gem. No brow center piercing. Nothing there. Plain skin only between and above the eyebrows.

Eyes: natural-looking red irises with normal white sclera — NOT glowing orbs, NOT fully red eyes. Normal eye shape with red colored irises.
Nails: long pointed stiletto-shaped, wine red.
Tattoos: witchy botanical/occult style tattoos on hands, arms, and chest — NOT on the face.
Hair: shoulder-length micro locs, thin and tightly coiled, dark brown.
Metals: strictly silver/white gold/platinum — NEVER gold or yellow metal.

Setting: Gothic stone castle interior background with atmospheric candlelight. Full body shot from mid-thigh up, so body proportions are fully visible.`;

async function main() {
    // New seeds to get fresh candidates with corrected prompt
    const variants = [
        { seed: 2024, name: 'anchor_body_corrected_v2024' },
        { seed: 5555, name: 'anchor_body_corrected_v5555' },
        { seed: 8888, name: 'anchor_body_corrected_v8888' },
    ];

    for (const v of variants) {
        await generateAnchor(bodyFirstPrompt, v.name, v.seed);
        if (v !== variants[variants.length - 1]) {
            console.log('Waiting 15 seconds between generations...');
            await new Promise(r => setTimeout(r, 15000));
        }
    }
    console.log('All corrected anchor variants done.');
}

main().catch(console.error);
