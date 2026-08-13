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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function generateImage(prompt, filename) {
  return new Promise((resolve, reject) => {
    console.log(`Generating ${filename}...`);
    const payload = JSON.stringify({
      input: {
        prompt: prompt,
        aspect_ratio: '1:1',
        output_format: 'jpg',
        safety_tolerance: 5,
        seed: 42
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

const basePrompt = "breathtaking digital illustration, gothic fantasy portrait, human witch, full-body shot, entire figure visible, standing pose, plus-size body, plain deep dark brown eyes, no amber, no hazel, no orange tones, STRICTLY SILVER, WHITE GOLD AND PLATINUM METALS ONLY, NO GOLD EVER. Snake bites: two small stud piercings on lower lip. Septum ring. Nostril studs. Eyebrow rings on outer tails. Left ear industrial bar plus one cartilage stud below it. Right earlobe stretched to 0 gauge. Rich deep umber-brown skin. Wine-red velvet robe with rich visible embroidery texture detail, asymmetrical dynamic drape, black nails, dark matte plum lips. Plain human ears, no point, no elf ears. ";

const tests = [
  // test_locks already generated successfully earlier, skipping it to save time/credits. Wait, no, I should just re-generate it to be sure if it wasn't saved, but the log said "Saved public\assets\avatar-tests\test_locks.jpg". Let me check if it exists.
  // Actually, I'll just generate the other two.
  { file: 'test_twists.jpg', hair: "Hair: Senegalese twists. Long smooth two-strand twists." },
  { file: 'test_puffs.jpg', hair: "Hair: two large round afro puffs on top of the head. Natural coarse texture." }
];

async function main() {
  for (const t of tests) {
    try {
      await generateImage(basePrompt + t.hair, t.file);
      await delay(4000); // Wait 4 seconds between requests
    } catch (e) {
      console.error(e);
    }
  }
}

main();
