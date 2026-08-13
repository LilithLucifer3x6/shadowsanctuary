const https = require('https');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const replicateToken = env.REPLICATE_API_TOKEN;

async function main() {
  console.log('Invoking Replicate API directly...');
  const payload = JSON.stringify({
    input: {
      prompt: 'breathtaking digital illustration, gothic fantasy portrait, human witch, plain deep dark brown eyes, no amber, no hazel, no orange tones, each loc is a single continuous rope of tightly coiled/matted hair uniform in texture along its full length - NOT two sections twisted around each other, NOT a twist-out style, NOT braided, STRICTLY SILVER AND DARK IRON METALS ONLY, no necklace, no earrings, no jewelry of any kind besides the specified piercings. Snake bites: two small stud piercings on lower lip. Septum ring. Nostril studs. Eyebrow rings on outer tails. Left ear industrial bar plus one cartilage stud below it. Right earlobe stretched to 0 gauge. Rich deep umber-brown skin. Wine-red velvet robe with rich visible embroidery texture detail, asymmetrical dynamic drape, black nails, dark matte plum lips. Plain human ears, no point, no elf ears.',
      aspect_ratio: '1:1',
      output_format: 'jpg',
      safety_tolerance: 5,
      seed: 81729
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
      console.log('Status Code:', res.statusCode);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const parsed = JSON.parse(data);
        console.log('Raw JSON Response:');
        console.log(JSON.stringify(parsed, null, 2));

        if (parsed.output) {
          const imageUrl = parsed.output;
          console.log('Downloading image from:', imageUrl);
          const dest = 'C:\\Users\\purpl\\.gemini\\antigravity\\brain\\1370394e-3b85-4504-bb15-db9d1cd803c0\\keeper_flux_human_v3.jpg';
          https.get(imageUrl, (imgRes) => {
            const file = fs.createWriteStream(dest);
            imgRes.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log('Image saved to', dest);
            });
          });
        }
      } else {
        console.error('Error:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Problem with request:', e.message);
  });

  req.write(payload);
  req.end();
}

main();
