import fs from 'fs';
import https from 'https';
import crypto from 'crypto';

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
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    let authData = await res.json();
    if (authData.error) throw new Error(authData.error_description || authData.error.message);
    const token = authData.access_token;
    console.log("Got JWT.");

    // Aggressively stripped out words like "Victorian", "opulent", "royalty", "ornamental" which force gold/headpieces in Flux
    const prompt = `Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading — combined with dramatic gothic chiaroscuro lighting, dark-fantasy tailoring, and moody saturated dark-fantasy color grading, illustrated portrait of a mystical Keeper. Distinctly plus size, heavy full figure body type, voluptuous and soft. Rich deep umber-brown skin, like dark roast coffee with only a small amount of cream. Hair: shoulder-length skinny traditional locks (thin dreadlocks), very thin and neatly maintained, individually visible and clearly separated, resembling thin rope. Coily natural Black hair texture — NOT braids, NOT straight, NOT wavy, NOT loose curls, NOT ringlets. ABSOLUTELY NO HAIR ACCESSORIES, completely bare hair, no headpieces, no clips, no tiaras, no jewelry in the hair. Richer, deeper brown eye color. Subtler, deeper-toned flush on the cheeks, not bright red. Full big lips; bold gothic deep blackish-red lipstick that matches the outfit's color exactly. Face Piercings: snake bites (two small studs on the lower lip), a septum ring, a small stud on each nostril, and a single eyebrow ring on the outer tail of each eyebrow. NO forehead piercings. Ear Piercings: Left ear specifically needs an industrial bar piercing running from the cartilage to the front of the ear, AND a small stud cartilage piercing positioned just below the industrial bar piercing. Both ears have standard double-zero (00) size gauge plugs in the earlobes, plus a small stud piercing positioned next to the gauge at the bottom of the earlobe. Long, pointy stiletto-shaped nails, ornately styled and witchy, colored to match the deep wine red outfit. Wearing a flowing, heavy fabric robe colored like a bottle of red wine or dried red wine — deep, dark, almost blackish-red in the shadows, NOT fire-engine red, NOT cherry red, NOT bright or saturated in value. Full-length flowing robe with wide sleeves, dark gothic aesthetic, wardrobe of a dark-magic practitioner: dense silver threading, intricate silver beadwork, dark iron clasps with dark gemstones, high structured collars. Overall vibe: imposing dark-fantasy presence, grounded — a witch living in the woods, rich, rustic-elegant, gothic. STRICTLY SILVER AND DARK IRON METALS ONLY. Completely absent of any yellow metals, completely absent of any brass. Ornate background, gothic witch-in-the-woods setting, rich magical details.`;
    
    // Add random seed to ensure a fresh generation
    const randomSeed = Math.floor(Math.random() * 1000000);
    console.log("Calling image-proxy with flux-2-pro and seed " + randomSeed + "...");
    
    res = await fetch(`${supabaseUrl}/functions/v1/image-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: "black-forest-labs/flux-2-pro",
        input: {
          prompt: prompt,
          output_format: "jpg",
          aspect_ratio: "1:1",
          seed: randomSeed
        }
      })
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

    let imageUrl = data.output;
    if (Array.isArray(imageUrl)) {
        imageUrl = imageUrl[0];
    }
    
    if (!imageUrl) {
       console.log("No output array returned. Output:", data);
       return;
    }

    console.log(`\nDownloading image from ${imageUrl}...`);
    
    const outPath = 'public/assets/mystical_keeper_flux2_final_baseline.jpg';
    const file = fs.createWriteStream(outPath);
    
    https.get(imageUrl, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(() => {
          console.log(`Saved to ${outPath}`);
          fs.copyFileSync(outPath, 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\1370394e-3b85-4504-bb15-db9d1cd803c0\\mystical_keeper_flux2_final_baseline.jpg');
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
