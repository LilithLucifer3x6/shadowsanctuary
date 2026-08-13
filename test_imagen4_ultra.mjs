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

// Approved baseline + full corrected piercing spec
const PROMPT = `Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading — combined with dramatic gothic chiaroscuro lighting, dark-fantasy tailoring, and moody saturated dark-fantasy color grading, illustrated portrait of a mystical Keeper. Distinctly plus size, heavy full figure body type, voluptuous and soft. Rich deep umber-brown skin, like dark roast coffee with only a small amount of cream. Hair: shoulder-length skinny traditional locks (thin dreadlocks), very thin and neatly maintained, individually visible and clearly separated, resembling thin rope. Coily natural Black hair texture — NOT braids, NOT straight, NOT wavy, NOT loose curls, NOT ringlets. ABSOLUTELY NO HAIR ACCESSORIES, completely bare hair, no headpieces, no clips, no tiaras, no jewelry in the hair. Richer, deeper brown eye color. Subtler, deeper-toned flush on the cheeks, not bright red. Full big lips; bold gothic deep blackish-red lipstick that matches the outfit's color exactly. Face Piercings: Two small stud piercings on the lower lip positioned toward the corners of the mouth (snake bites — NOT centered on the lip, NOT on the chin); a septum ring; a small stud piercing on each nostril; an eyebrow ring at the outer/tail end of each eyebrow on both sides. NO forehead piercings, NO between-eyebrows piercing, NO bindi, NO forehead dot. Ear Piercings: Left ear specifically has an industrial bar piercing running from the cartilage to the front of the ear, AND a separate small stud cartilage piercing positioned just below the industrial bar; both ears have standard double-zero (00) sized gauge plugs in the earlobes (NOT oversized), plus a small stud piercing positioned next to each gauge plug at the bottom of the earlobe. Long, pointy stiletto-shaped nails, ornately styled and witchy, colored to match the deep wine red outfit. Wearing a flowing, heavy fabric robe colored like a bottle of red wine or dried red wine — deep, dark, almost blackish-red in the shadows, NOT fire-engine red, NOT cherry red, NOT bright or saturated in value. Full-length flowing robe with wide sleeves, dark gothic aesthetic, wardrobe of a dark-magic practitioner: dense silver threading, intricate silver beadwork, dark iron clasps with dark gemstones, high structured collars. Overall vibe: imposing dark-fantasy presence, grounded — a witch living in the woods, rich, rustic-elegant, gothic. STRICTLY SILVER AND DARK IRON METALS ONLY. Completely absent of any yellow metals, completely absent of any brass. Ornate background, gothic witch-in-the-woods setting, rich magical details.`;

async function main() {
  try {
    console.log('Signing in...');
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const authData = await authRes.json();
    if (authData.error) throw new Error(authData.error_description || authData.error.message);
    const token = authData.access_token;
    console.log('Got JWT. Calling google/imagen-4-ultra...');

    const res = await fetch(`${supabaseUrl}/functions/v1/image-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        model: 'google/imagen-4-ultra',
        input: {
          prompt: PROMPT,
          aspect_ratio: '1:1',
          output_format: 'jpg'
        }
      })
    });

    const responseText = await res.text();
    let data;
    try { data = JSON.parse(responseText); }
    catch (e) { throw new Error(`Failed to parse: ${responseText.substring(0, 500)}`); }

    console.log('\n=== Raw Prediction Response (Imagen-4 Ultra) ===');
    console.log(JSON.stringify(data, null, 2));

    if (!res.ok) throw new Error(`Proxy error: ${JSON.stringify(data)}`);

    let imageUrl = data.output;
    if (Array.isArray(imageUrl)) imageUrl = imageUrl[0];
    if (!imageUrl) { console.log('No output URL. Full response:', data); return; }

    console.log(`\nImage URL: ${imageUrl}`);
    console.log('Downloading...');

    const outPath = 'public/assets/keeper_imagen4_ultra_test.jpg';
    const artifactPath = 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\1370394e-3b85-4504-bb15-db9d1cd803c0\\keeper_imagen4_ultra_test.jpg';

    await new Promise((resolve, reject) => {
      const file = fs.createWriteStream(outPath);
      https.get(imageUrl, (response) => {
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', (err) => { try { fs.unlinkSync(outPath); } catch(_){} reject(err); });
    });

    fs.copyFileSync(outPath, artifactPath);
    console.log(`\nSaved to: ${outPath}`);
    console.log(`Copied to artifact: ${artifactPath}`);
    console.log('\nDone.');

  } catch (err) {
    console.error('Failed:', err);
  }
}

main();
