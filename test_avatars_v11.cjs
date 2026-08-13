const https = require('https');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const replicateToken = env.REPLICATE_API_TOKEN;
const outDirRepo = path.join('public', 'assets', 'avatar-tests');
const outDirArtifacts = 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\1370394e-3b85-4504-bb15-db9d1cd803c0';
if (!fs.existsSync(outDirRepo)) fs.mkdirSync(outDirRepo, { recursive: true });
if (!fs.existsSync(outDirArtifacts)) fs.mkdirSync(outDirArtifacts, { recursive: true });

async function generateImage(prompt, aspect_ratio, filename) {
  return new Promise((resolve, reject) => {
    console.log(`Generating ${filename}...`);
    const payload = JSON.stringify({
      input: {
        prompt: prompt,
        aspect_ratio: aspect_ratio,
        output_format: 'jpg',
        safety_tolerance: 5,
        seed: 74219 // fresh seed
      }
    });

    const options = {
      hostname: 'api.replicate.com',
      port: 443,
      path: '/v1/models/black-forest-labs/flux-1.1-pro-ultra/predictions',
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const parsed = JSON.parse(data);
          if (parsed.output) {
            const destRepo = path.join(outDirRepo, filename);
            const destArtifact = path.join(outDirArtifacts, filename);
            https.get(parsed.output, (imgRes) => {
              const fileRepo = fs.createWriteStream(destRepo);
              imgRes.pipe(fileRepo);
              imgRes.on('end', () => {
                fs.copyFileSync(destRepo, destArtifact);
                console.log(`Saved ${destRepo} and ${destArtifact}`);
                resolve();
              });
            });
          } else {
            console.error("No output in JSON:", parsed);
            reject(new Error("No output in JSON"));
          }
        } else {
          reject(new Error(`API Error: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Replaced "witch" with "sorceress" to avoid the AI hallucinating stereotypical witch tropes (hats, staves, rags).
// Added the explicit standalone negative for hats and props.
const prompt = "Full-body shot, entire figure visible from head to feet including feet, standing pose, 2:3 portrait aspect ratio. Japanese animation art style in the vein of Castlevania (Netflix series), Soul Eater, and Studio Ghibli films — painterly digital illustration with clean, confident line art, cel-shaded coloring with soft gradient shading, moody atmospheric lighting, detailed expressive facial features with realistic proportions, rich and detailed color palette. Serious dark-fantasy animated style, not a comic book style, not a superhero style, not a children's cartoon style. A wealthy, refined sorceress — NOT poor, NOT rustic, NOT a stereotypical broke woodland sorceress. Elegant and well-kept, not tattered or ragged clothing. a distinctly plus-size woman. a large but realistic bust, F to G cup range — NOT exaggerated, NOT cartoonishly oversized. Skin: rich, deep umber-brown skin tone, like dark roast coffee with only a small amount of cream — NOT medium brown, NOT tan, NOT light skin. Normal human eyes with white sclera, only the iris colored red — NOT the entire eye glowing red, NOT a solid red orb for an eye. A normal-looking eye shape where just the iris (the colored ring around the pupil) is red. No forehead markings, no bindi, no gem or jewelry on the forehead, plain unmarked forehead. No unexplained marks or dots on the face. Hair: traditional locked hair (locs), shoulder-length, individually visible rope-like locs, consistent texture from root to tip, natural coily Black hair texture — NOT loose, NOT straight, NOT wavy, NOT flowing free. fully clothed, wearing a simple, elegant wine-red robe, securely fastened and completely covering the body from neck to floor, no cleavage, no skin showing at all except the face and hands. NO witch hat, NO pointed hat of any kind, NO staff, NO cane, NO wand, NO magical prop or object being held. STRICTLY SILVER, WHITE GOLD, OR PLATINUM METALS ONLY, absolutely no gold, no brass.";

async function main() {
  try {
    await generateImage(prompt, '2:3', 'test_dark_fantasy_fullbody_v4.jpg');
  } catch (e) {
    console.error(e);
  }
}

main();
