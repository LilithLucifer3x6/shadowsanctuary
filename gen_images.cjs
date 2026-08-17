require('dotenv').config();
const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function downloadStream(stream, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    // Convert Web ReadableStream to Node Readable
    Readable.fromWeb(stream).pipe(file);
    file.on('finish', () => {
      file.close();
      resolve();
    });
    file.on('error', reject);
  });
}

async function run() {
  const model = "google/nano-banana-pro";
  const outputDir = path.join(__dirname, 'public', 'assets', 'avatar-tests');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const refImage = "https://raw.githubusercontent.com/LilithLucifer3x6/shadowsanctuary/main/public/assets/avatar-tests/part5_169_action_mortal_rites_corrected.jpg";
  const basePrompt = "A highly stylized, gorgeous mature witch with flawless deep umber-brown skin (dark roast coffee with cream); plus-size ~5'8\"/256-265 lbs genuine hourglass; individual micro locs, black, symmetric hair sticks (3 each side) with festoon chains bearing star/moon charms; red irises; absolutely nothing between the eyebrows; NO face tattoos anywhere, standalone hard negative; septum ring, nostril studs, eyebrow rings, snake-bite lip studs on the lip itself, left ear industrial bar + cartilage stud + gauge; moon collar as a snug CHOKER not a necklace; silver/white-gold jewelry only, no gold ever; delicate dainty witchy-botanical black tattoos on chest/arms/legs/sternum/back only, deep rich black; silver-embroidered crane AND cherry blossom kimono on black/deep crimson, black inner lining, a TRUE structured traditional obi with a real back-bow; long stiletto nails, not excessive; ";

  const prompts = [
    {
      name: "part1_nano_mortal_rites.jpg",
      prompt: basePrompt + "barefoot or white tabi socks indoors. Scene: The Mortal Rites, indoors, standing in a shadowy candlelit sanctuary with apothecary bottles and glowing embers. Dark, moody, premium, cinematic lighting. (1) confirm stiletto nails present, (2) robe inside lining and obi corrected from pink to deep rich crimson."
    },
    {
      name: "part2_nano_torii.jpg",
      prompt: basePrompt + "geta (two separated blocks, crimson strap, black platform, 9+ inches) only outdoors. Scene: She stands outdoors before a weathered torii gate at night, stone lanterns flanking a stone path, a traditional Japanese manor visible in the mist behind. Crescent moon in the sky. Dark, moody, premium, cinematic lighting."
    },
    {
      name: "part2_nano_writing_desk.jpg",
      prompt: basePrompt + "barefoot or white tabi socks indoors. Scene: She sits indoors in seiza at a low traditional Japanese chabudai desk over blank parchment, candlelit, holding an ink brush, with a stone inkstone. Shoji screens in background, tatami floor. Dark, moody, premium, cinematic lighting."
    },
    {
      name: "part2_nano_moss_garden.jpg",
      prompt: basePrompt + "geta (two separated blocks, crimson strap, black platform, 9+ inches) only outdoors. Scene: She pauses on stepping stones in a deep-moss traditional Japanese garden at dusk. Stone lanterns glow, twisted pine overhead, a Japanese manor in the distance through mist. Dark, moody, premium, cinematic lighting."
    }
  ];

  for (const p of prompts) {
    console.log(`Generating ${p.name}...`);
    try {
      const output = await replicate.run(model, {
        input: {
          prompt: p.prompt,
          image: refImage,
          aspect_ratio: "16:9"
        }
      });
      console.log(`Success for ${p.name}. Streaming to file...`);
      const dest = path.join(outputDir, p.name);
      
      if (output && output.locked !== undefined) {
         await downloadStream(output, dest);
      } else if (Array.isArray(output) && output.length > 0) {
         // handle URL array if it returns strings
         const url = output[0];
         await new Promise((resolve, reject) => {
           const file = fs.createWriteStream(dest);
           require('https').get(url, (response) => {
             response.pipe(file);
             file.on('finish', () => resolve());
           }).on('error', reject);
         });
      }
      
      console.log(`Saved to ${dest}`);
    } catch (err) {
      console.error(`Error for ${p.name}:`, err.message);
    }
  }
}

run();
