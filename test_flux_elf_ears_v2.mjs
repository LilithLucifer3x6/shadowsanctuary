import fs from 'fs';
import https from 'https';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const testEmail = 'test_1786474323159@gmail.com';
const testPassword = 'flux_test_password_123!';

async function main() {
  try {
    console.log("Signing in...");
    let res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    
    let authData = await res.json();
    if (authData.error) throw new Error(authData.error_description || authData.error.message);
    const token = authData.access_token;
    console.log("Got JWT.");

    const prompt = `Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading — combined with dramatic gothic chiaroscuro lighting, dark-fantasy tailoring, and moody saturated dark-fantasy color grading, illustrated portrait of a mystical Keeper. Distinctly plus size, heavy full figure body type, voluptuous and soft. Rich deep umber-brown skin, like dark roast coffee with only a small amount of cream. Subtly pointed ear tips, not exaggerated or extreme — a slight point, not full elf/fantasy-creature ears. Hair: shoulder-length skinny traditional locs, very thin and neatly maintained, individually visible and clearly separated, resembling thin rope. Natural coily Black hair texture locs, matte and organic looking — NOT glossy, NOT synthetic, NOT plastic-looking, NOT uniform like fiber extensions. ABSOLUTELY NO HAIR ACCESSORIES, completely bare hair, no headpieces, no clips, no tiaras, no jewelry in the hair. Richer, deeper brown eyes. No glow effect, no color change. Subtler, deeper-toned flush on the cheeks, not bright red. Full big lips; bold gothic deep blackish-red lipstick that matches the outfit's color exactly. Face Piercings: snake bites (two paired studs near the lower lip corners), septum ring, nostril studs both sides, eyebrow rings both sides. No forehead piercing, no cheek piercings, no dermals. Ear Piercings: Left ear industrial bar + cartilage stud. Earlobe gauges (standard 00 size) both ears. Long, pointy stiletto-shaped nails, ornately styled and witchy, colored to match the deep wine red outfit. Wearing a flowing, heavy fabric robe colored like a bottle of red wine or dried red wine — deep, dark, almost blackish-red in the shadows, NOT fire-engine red, NOT cherry red, NOT bright or saturated in value. Full-length flowing robe with wide sleeves, dark gothic aesthetic, wardrobe of a dark-magic practitioner: dense silver threading, intricate silver beadwork, dark iron clasps with dark gemstones, high structured collars. Overall vibe: imposing dark-fantasy presence, grounded — a witch living in the woods, rich, rustic-elegant, gothic. STRICTLY SILVER AND DARK IRON METALS ONLY. Absolutely no gold, no brass, no yellow metals anywhere — not in jewelry, not in trim, not in accents. Zero exceptions. NO necklace, NO dangly earrings, NO bracelets. Ornate background, gothic witch-in-the-woods setting, rich magical details.`;
    
    const randomSeed = Math.floor(Math.random() * 1000000);
    console.log("Calling image-proxy with flux-1.1-pro-ultra and seed " + randomSeed + "...");
    
    const payload = {
      model: "black-forest-labs/flux-1.1-pro-ultra",
      input: {
        prompt: prompt,
        output_format: "jpg",
        aspect_ratio: "1:1",
        seed: randomSeed
      }
    };

    res = await fetch(`${supabaseUrl}/functions/v1/image-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await res.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Failed to parse response: ${responseText}`);
    }

    if (!res.ok) {
      throw new Error(`Proxy error: ${JSON.stringify(data)}`);
    }

    console.log("\nRAW PROXY JSON RESPONSE (including model):");
    console.log(JSON.stringify(data, null, 2));

    let imageUrl = data.output;
    if (Array.isArray(imageUrl)) {
        imageUrl = imageUrl[0];
    }
    
    if (!imageUrl) {
       console.log("No output array returned. Output:", data);
       return;
    }

    console.log(`\nDownloading image from ${imageUrl}...`);
    
    const outPath = 'public/assets/keeper_flux_elf_ears_v2.jpg';
    const file = fs.createWriteStream(outPath);
    
    https.get(imageUrl, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(() => {
          console.log(`Saved to ${outPath}`);
          fs.copyFileSync(outPath, 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\1370394e-3b85-4504-bb15-db9d1cd803c0\\keeper_flux_elf_ears_v2.jpg');
        });
      });
    }).on('error', function(err) { 
      fs.unlinkSync(outPath);
      console.error("Download error:", err.message);
    });

  } catch (err) {
    console.error("Execution failed:", err);
  }
}

main();
