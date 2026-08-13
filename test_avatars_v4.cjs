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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generateImage(prompt, aspect_ratio, filename) {
  return new Promise((resolve, reject) => {
    console.log(`Generating ${filename}...`);
    const payload = JSON.stringify({
      input: {
        prompt: prompt,
        aspect_ratio: aspect_ratio,
        output_format: 'jpg',
        safety_tolerance: 5,
        seed: 71239
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
              // Also save to artifacts for embedding
              imgRes.pipe(fileRepo);
              imgRes.on('end', () => {
                fs.copyFileSync(destRepo, destArtifact);
                console.log(`Saved ${destRepo} and ${destArtifact}`);
                resolve();
              });
            });
          } else {
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

const styleAnchor = "Hand-painted 2D animated illustration, cel-shaded, with visible brushwork texture and bold expressive linework — a lush painterly fantasy-anime style, like a hand-drawn animated film crossed with gothic vampire-hunter dark fantasy. NOT photorealistic, NOT a digital painting rendered like a photo, NOT 3D-rendered — flat cel-shading with clear linework, anime/manga-influenced proportions and expression.";

const promptIsolatedEyes = `${styleAnchor} Close up portrait of a woman witch's face. Rich deep umber-brown skin. dark brown eyes, like coffee — NOT amber, NOT orange, NOT golden, NOT hazel.`;

const promptFull = `${styleAnchor} Full-body photo, entire figure visible from head to feet, standing pose. a distinctly plus-size, full-figured woman witch. dark brown eyes, like coffee — NOT amber, NOT orange, NOT golden, NOT hazel. shoulder-length thin, narrow-width individual locs. Each loc is a single continuous rope of tightly coiled/matted hair, uniform in texture along its full length - NOT two sections twisted around each other, NOT a twist-out style, NOT braided. STRICTLY SILVER, WHITE GOLD, AND PLATINUM METALS ONLY. NO GOLD EVER. Body piercings (not earrings, not dangling jewelry) — a small ring through the septum, a small stud in each nostril, a small ring on the outer end of each eyebrow, two small studs on the lower lip near the corners, an industrial bar through the upper ear cartilage, a stretched earlobe with a standard double-zero gauge plug. Rich deep umber-brown skin. Wine-red velvet robe with rich visible embroidery texture detail, asymmetrical dynamic drape. black nails, dark matte plum lips. Plain human ears, no point, no elf ears.`;

async function main() {
  try {
    await generateImage(promptIsolatedEyes, '1:1', 'test_eyes_isolated.jpg');
    await delay(4000); // Respect rate limit
    await generateImage(promptFull, '2:3', 'test_full_body_2_3.jpg');
  } catch (e) {
    console.error(e);
  }
}

main();
