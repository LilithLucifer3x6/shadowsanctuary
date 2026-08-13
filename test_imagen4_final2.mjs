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

const BASELINE_PROMPT = "Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading — combined with dramatic gothic chiaroscuro lighting, dark-fantasy tailoring, and moody saturated dark-fantasy color grading, illustrated portrait of a mystical Keeper. Distinctly plus size, heavy full figure body type, voluptuous and soft. Skin: rich, deep umber-brown skin, like dark roast coffee with only a small amount of cream — NOT medium brown, NOT tan, NOT light-to-medium skin tone. Hair: shoulder-length skinny traditional locks (thin dreadlocks), very thin and neatly maintained, individually visible and clearly separated, resembling thin rope. Coily natural Black hair texture — NOT braids, NOT straight, NOT wavy, NOT loose curls, NOT ringlets. ABSOLUTELY NO HAIR ACCESSORIES, completely bare hair, no headpieces, no clips, no tiaras, no jewelry in the hair. Richer, deeper brown eye color. Subtler, deeper-toned flush on the cheeks, not bright red. Full big lips; bold gothic deep blackish-red lipstick that matches the outfit's color exactly. Face Piercings: snake bites (two small stud piercings, paired, on either side of the lower lip near the corners — NOT a single labret ring, NOT centered, NOT on the chin), a septum ring, a small stud piercing on each nostril, and an eyebrow ring at the outer/tail end of each eyebrow, both sides. Absolutely NO piercing between the eyebrows/forehead. Absolutely NO cheek piercings. NO dermal piercings anywhere. Ears: pointed/elf-like ears. Ear Piercings: Left ear: an industrial bar piercing (cartilage to front of ear) PLUS one separate cartilage stud below it — NOT two cartilage rings. Both ears have earlobe gauges, standard double-zero (00) size, visible on both ears. Long, pointy stiletto-shaped nails, ornately styled and witchy, colored to match the deep wine red outfit. Wearing a flowing, heavy fabric robe colored like a bottle of red wine or dried red wine — deep, dark, almost blackish-red in the shadows, NOT fire-engine red, NOT cherry red, NOT bright or saturated in value. Full-length flowing robe with wide sleeves, dark gothic aesthetic, wardrobe of a dark-magic practitioner: dense silver threading, intricate silver beadwork, dark iron clasps with dark gemstones, high structured collars. Overall vibe: imposing dark-fantasy presence, grounded — a witch living in the woods, rich, rustic-elegant, gothic. STRICTLY SILVER AND DARK IRON METALS ONLY. Completely absent of any yellow metals, completely absent of any brass. Ornate background, gothic witch-in-the-woods setting, rich magical details.";

async function testModel(token, modelId, outputPath, modelLabel) {
  console.log("\\n=== Testing " + modelLabel + " (" + modelId + ") ===");

  const res = await fetch(supabaseUrl + "/functions/v1/image-proxy", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      model: modelId,
      input: {
        prompt: BASELINE_PROMPT,
        aspect_ratio: "1:1",
        output_format: "jpg"
      }
    })
  });

  const responseText = await res.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error("Failed to parse response: " + responseText.substring(0, 500));
  }

  console.log("\\nRaw prediction response for " + modelLabel + ":");
  console.log(JSON.stringify(data, null, 2));

  if (!res.ok) {
    console.error("ERROR from proxy: " + JSON.stringify(data));
    return null;
  }

  let imageUrl = data.output;
  if (Array.isArray(imageUrl)) imageUrl = imageUrl[0];

  if (!imageUrl) {
    console.log("No output URL returned. Full response:", data);
    return null;
  }

  console.log("\\nImage URL: " + imageUrl);
  console.log("Downloading to " + outputPath + "...");

  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(imageUrl, (response) => {
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlinkSync(outputPath);
      reject(err);
    });
  });

  console.log("Saved: " + outputPath);

  const artifactPath = "C:\\\\Users\\\\purpl\\\\.gemini\\\\antigravity\\\\brain\\\\1370394e-3b85-4504-bb15-db9d1cd803c0\\\\" + outputPath.split('/').pop();
  fs.copyFileSync(outputPath, artifactPath);
  console.log("Copied to artifact: " + artifactPath);

  return imageUrl;
}

async function main() {
  try {
    console.log("Signing in...");
    const res = await fetch(supabaseUrl + "/auth/v1/token?grant_type=password", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': supabaseAnonKey },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });

    const authData = await res.json();
    if (authData.error) throw new Error(authData.error_description || authData.error.message);
    const token = authData.access_token;
    console.log("Got JWT. Starting image test...");

    await testModel(
      token,
      'google/imagen-4',
      'public/assets/keeper_imagen4_final2.jpg',
      'Imagen 4 Standard Final'
    );

  } catch (err) {
    console.error("Execution failed:", err);
  }
}

main();
