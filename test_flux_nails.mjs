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
    console.log("Setting password in db...");
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

    const prompt = "Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading (soft-edged shading transitions, not hard vector lines, not photographic smoothness or skin-pore detail) — combined with dramatic gothic chiaroscuro lighting (strong contrast between deep shadow and warm highlight), richly ornamental Victorian detail work, and moody saturated dark-fantasy color grading, anime-influenced expressive linework, illustrated portrait of a mystical Keeper. Plus size, full figure body type. Dark rich umber skin. Hair: skinny traditional locks, thin and neatly maintained, individually visible, shoulder-length, coily natural Black hair texture — NOT straight, NOT wavy, NOT European hair texture. Deep brown eyes, richer and more seductive-styled, not generic. Full big lips; lower lip pink, upper lip half pink and half brown (two-tone, not a uniform color). Facial piercings (no dangly earrings, no necklaces): snake bites (two piercings on either side of the CENTER OF THE LOWER LIP), a small nose ring on each nostril plus a small silver stud next to each, right ear cartilage piercing, left ear industrial piercing plus cartilage piercing, both earlobes stretched with double-zero gauge plugs plus one small silver stud as a second piercing next to each gauge. Piercings ONLY on the lips and ears as specified — no cheek piercings, no facial piercings elsewhere. Long, pointy stiletto-shaped nails, ornately styled and witchy, colored to match the mahogany/silver outfit palette. Wearing an extravagantly opulent deep mahogany robe of Full-length flowing robe with wide sleeves and embroidered magical trim design — the wardrobe of a Victorian-era vampiric noble, dripping in opulence as though an entire country's treasury were behind it: dense silver embroidery, intricate beadwork, jeweled clasps, high structured collars, dramatic fitted sleeves, ornate brooches and cameos, dark romantic elegance, rich brocade and heavy embellished trim, sumptuous and expensive-looking in every detail. Overall vibe: gothic, not delicate or dainty. NO gold anywhere — no gold trim, no gold clasps, no gold jewelry, no gold accents of any kind, silver and dark metals only. Absolutely no jewelry (no necklaces, no chokers, no pendants) other than the specified facial and ear piercings. No forehead markings, no bindi, no dot, no jewelry or ornamentation on the forehead. Plain neutral gray background. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.";
    
    console.log("Calling image-proxy with flux-2-pro...");
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
          output_format: "jpg"
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

    console.log("=== RAW PREDICTION RESPONSE ===");
    console.log(JSON.stringify(data, null, 2));

    const imageUrl = data.output;
    if (!imageUrl) {
       console.log("No output array returned. Output:", data);
       return;
    }

    console.log(`\nDownloading image from ${imageUrl}...`);
    
    const outPath = 'public/assets/flowing_ceremonial_mahogany_flux2_test_nails.jpg';
    const file = fs.createWriteStream(outPath);
    
    https.get(imageUrl, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close(() => {
          console.log(`Saved to ${outPath}`);
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
