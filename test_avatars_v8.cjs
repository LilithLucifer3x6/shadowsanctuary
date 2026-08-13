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
        seed: 73921
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

const prompt = "Full-body shot, entire figure visible from head to feet including feet, standing pose, 2:3 portrait aspect ratio. Japanese animation art style in the vein of Castlevania (Netflix series), Soul Eater, and Studio Ghibli films — painterly digital illustration with clean, confident line art, cel-shaded coloring with soft gradient shading, moody atmospheric lighting, detailed expressive facial features with realistic proportions, rich and detailed color palette. Serious dark-fantasy animated style, not a comic book pinup style, not a superhero style, not a children's cartoon style. a distinctly plus-size, full-figured woman witch. rich, deep umber-brown skin. fully clothed, wearing a full-length wine-red velvet robe with silver embroidery, rich detail, dynamic drape. glowing red eyes, vivid and striking, with a subtle luminous glow. No unexplained marks or dots on the face. traditional black locked hair, shoulder-length, consistent locked texture from root to tip. STRICTLY SILVER, WHITE GOLD, OR PLATINUM METALS ONLY, no gold, no brass. Body piercings (not earrings, not dangling jewelry) — a small ring through the septum, a small stud in each nostril, a small ring on the outer end of each eyebrow, two small studs on the lower lip near the corners (snake bites), a left ear industrial bar plus cartilage stud, a stretched earlobe with a double-zero gauge plug. long, pointed stiletto-shaped fingernails.";

async function main() {
  try {
    await generateImage(prompt, '2:3', 'test_dark_fantasy_fullbody.jpg');
  } catch (e) {
    console.error(e);
  }
}

main();
