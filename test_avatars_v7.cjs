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
        seed: 48921
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

const prompt = "Japanese animation art style in the vein of Castlevania (Netflix series), Soul Eater, and Studio Ghibli films — painterly digital illustration with clean, confident line art, cel-shaded coloring with soft gradient shading (not flat, not harsh line-art-only), moody atmospheric lighting, detailed expressive facial features with realistic proportions (not chibi, not exaggerated cartoon proportions), rich and detailed color palette. This is a serious dark-fantasy animated style, not a comic book style, not a superhero style, not a children's cartoon style. full-body shot showing the complete figure from the top of the head down to and including the feet, standing on the ground, feet visible in frame. a distinctly plus-size, full-figured woman witch. glowing red eyes, vivid and striking, with a subtle luminous glow. No unexplained marks or dots on the face. traditional black locked hair, shoulder-length, natural loc texture from root to tip — the entire length of each loc should look the same consistent locked texture. NOT purple, NOT any unnatural hair color. STRICTLY SILVER, WHITE GOLD, OR PLATINUM METALS ONLY, no gold, no brass. Body piercings (not earrings, not dangling jewelry) — a small ring through the septum, a small stud in each nostril, a small ring on the outer end of each eyebrow, two small studs on the lower lip near the corners, an industrial bar through the upper ear cartilage, a stretched earlobe with a standard double-zero gauge plug. rich, deep umber-brown skin, like dark roast coffee with only a small amount of cream — NOT purple, NOT any unnatural skin color. fully clothed, wearing a conservative Wine-red velvet full-length robe with silver embroidery, rich detail, dynamic drape, fully covering the body. long, pointed stiletto-shaped fingernails. dark matte plum lips.";

async function main() {
  try {
    await generateImage(prompt, '2:3', 'test_dark_fantasy_anime.jpg');
  } catch (e) {
    console.error(e);
  }
}

main();
