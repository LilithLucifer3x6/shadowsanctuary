import fs from 'fs/promises';
import path from 'path';
import Replicate from 'replicate';
import { createWriteStream, existsSync } from 'fs';
import { Readable } from 'stream';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const ROOMS = [
  { id: 'rites', title: 'The Mortal Rites', prompt: 'Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading, dramatic gothic chiaroscuro lighting. An empty apothecary bathroom featuring a glowing ornate mirror, crystal vials, and drying herbs. No people, no characters, just the atmospheric empty room. Lush painterly rendering, gothic dark-fantasy video-game aesthetic.' },
  { id: 'grimoire', title: 'The Grimoire', prompt: 'Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading, dramatic gothic chiaroscuro lighting. An empty ancient library with floating glowing books, deep mahogany shelves, and starlight filtering through a stained-glass window. No people, no characters, just the atmospheric empty room. Lush painterly rendering, gothic dark-fantasy video-game aesthetic.' },
  { id: 'altars', title: 'The Altars', prompt: 'Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading, dramatic gothic chiaroscuro lighting. An empty sacred ritual space with candles, offerings of fruit, and a glowing moonstone altar. No people, no characters, just the atmospheric empty room. Lush painterly rendering, gothic dark-fantasy video-game aesthetic.' },
  { id: 'rootwork', title: 'The Rootwork', prompt: 'Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading, dramatic gothic chiaroscuro lighting. An empty herbalist greenhouse filled with glowing nocturnal plants, hanging dried roots, and glass terrariums. No people, no characters, just the atmospheric empty room. Lush painterly rendering, gothic dark-fantasy video-game aesthetic.' },
  { id: 'scrying', title: 'The Scrying Pool', prompt: 'Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading, dramatic gothic chiaroscuro lighting. An empty dark chamber featuring a glowing scrying pool with swirling visions of wisdom in the water. No people, no characters, just the atmospheric empty room. Lush painterly rendering, gothic dark-fantasy video-game aesthetic.' },
  { id: 'shadowtome', title: 'The Shadow Tome', prompt: 'Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading, dramatic gothic chiaroscuro lighting. An empty study room lit by candlelight, featuring a large open leather-bound shadow tome on a desk, surrounded by drying herbs, honey jars, and a warm cup of herbal tea. No people, no characters, just the atmospheric empty room. Lush painterly rendering, gothic dark-fantasy video-game aesthetic.' },
  { id: 'sanctuary', title: 'Intake', prompt: 'Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading, dramatic gothic chiaroscuro lighting. The grand, empty exterior gates and majestic entrance hall of a dark-fantasy gothic forest manor, surrounded by ancient glowing trees. No people, no characters, just the atmospheric empty environment. Lush painterly rendering, gothic dark-fantasy video-game aesthetic.' },
];

async function main() {
  const outDir = path.resolve('public/assets');

  for (const room of ROOMS) {
    const filename = `bg_${room.id}.jpg`;
    const outPath = path.join(outDir, filename);

    if (existsSync(outPath)) {
       console.log(`Skipping ${room.id} - already exists!`);
       continue;
    }

    console.log(`Generating ${room.id}...`);
    let success = false;
    let retries = 3;

    while (!success && retries > 0) {
      try {
        const output = await replicate.run(
          "google/nano-banana-pro",
          {
            input: {
              prompt: room.prompt,
              width: 1024,
              height: 1024,
              output_format: "jpg"
            }
          }
        );

        let downloadUrl = output;
        if (Array.isArray(output)) downloadUrl = output[0];
        
        if (typeof downloadUrl === 'string' && downloadUrl.startsWith('http')) {
          const response = await fetch(downloadUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          await fs.writeFile(outPath, buffer);
          console.log(`Saved ${filename}`);
          success = true;
        } else if (downloadUrl && typeof downloadUrl.getReader === 'function') {
          const nodeStream = Readable.fromWeb(downloadUrl);
          const writeStream = createWriteStream(outPath);
          await new Promise((resolve, reject) => {
              nodeStream.pipe(writeStream);
              nodeStream.on('end', resolve);
              nodeStream.on('error', reject);
              writeStream.on('finish', resolve);
          });
          console.log(`Saved stream for ${filename}`);
          success = true;
        } else {
          console.log(`Unexpected output for ${room.id}:`, output);
          success = true; // Avoid infinite loop on weird outputs
        }
      } catch (e) {
        console.error(`Failed to generate ${room.id}:`, e.message);
        retries--;
        if (retries > 0) {
           console.log(`Retrying in 20s... (${retries} retries left)`);
           await new Promise(r => setTimeout(r, 20000));
        } else {
           console.log(`Skipping ${room.id} after max retries.`);
        }
      }
    }
    
    // Wait 15 seconds to avoid rate limit
    console.log('Waiting 15s to avoid rate limit...');
    await new Promise(r => setTimeout(r, 15000));
  }
}

main().catch(console.error);
