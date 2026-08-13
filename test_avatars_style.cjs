const https = require('https');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const replicateToken = env.REPLICATE_API_TOKEN;
const outDir = path.join('public', 'assets', 'avatar-tests');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function generateImage(prompt, filename) {
  return new Promise((resolve, reject) => {
    console.log(`Generating ${filename}...`);
    const payload = JSON.stringify({
      input: {
        prompt: prompt,
        aspect_ratio: '1:1',
        output_format: 'jpg',
        safety_tolerance: 5,
        seed: 94812
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
            const dest = path.join(outDir, filename);
            https.get(parsed.output, (imgRes) => {
              const file = fs.createWriteStream(dest);
              imgRes.pipe(file);
              file.on('finish', () => {
                file.close();
                console.log(`Saved ${dest}`);
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

const prompt = "Hand-painted 2D animated illustration, cel-shaded, with visible brushwork texture and bold expressive linework — a lush painterly fantasy-anime style, like a hand-drawn animated film crossed with gothic vampire-hunter dark fantasy. NOT photorealistic, NOT a digital painting rendered like a photo, NOT 3D-rendered — flat cel-shading with clear linework, anime/manga-influenced proportions and expression. Full-body photo, entire figure visible from head to feet, standing pose. a distinctly plus-size, full-figured woman witch. dark brown eyes, like coffee — NOT amber, NOT orange, NOT golden, NOT hazel. shoulder-length thin, narrow-width individual locs. Each loc is a single continuous rope of tightly coiled/matted hair, uniform in texture along its full length - NOT two sections twisted around each other, NOT a twist-out style, NOT braided. STRICTLY SILVER, WHITE GOLD AND PLATINUM METALS ONLY, NO GOLD EVER. Body piercings (not earrings, not dangling jewelry) — a small ring through the septum, a small stud in each nostril, a small ring on the outer end of each eyebrow, two small studs on the lower lip near the corners, an industrial bar through the upper ear cartilage, a stretched earlobe with a standard double-zero gauge plug. Rich deep umber-brown skin. Wine-red velvet robe with rich visible embroidery texture detail, asymmetrical dynamic drape. black nails, dark matte plum lips. Plain human ears, no point, no elf ears.";

async function main() {
  try {
    await generateImage(prompt, 'test_cartoony_style.jpg');
  } catch (e) {
    console.error(e);
  }
}

main();
