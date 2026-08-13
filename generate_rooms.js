import fs from 'fs/promises';
import path from 'path';
import Replicate from 'replicate';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const ROOMS = [
  { id: 'scrying', title: 'The Scrying Pool', prompt: 'Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading, dramatic gothic chiaroscuro lighting. An empty dark chamber featuring a glowing scrying pool with swirling visions of wisdom in the water. No people, no characters, just the atmospheric empty room. Lush painterly rendering, gothic dark-fantasy video-game aesthetic.' },
  { id: 'shadowtome', title: 'The Shadow Tome', prompt: 'Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading, dramatic gothic chiaroscuro lighting. An empty study room lit by candlelight, featuring a large open leather-bound shadow tome on a desk, surrounded by drying herbs, honey jars, and a warm cup of herbal tea. No people, no characters, just the atmospheric empty room. Lush painterly rendering, gothic dark-fantasy video-game aesthetic.' },
  { id: 'sanctuary', title: 'Intake', prompt: 'Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading, dramatic gothic chiaroscuro lighting. The grand, empty exterior gates and majestic entrance hall of a dark-fantasy gothic forest manor, surrounded by ancient glowing trees. No people, no characters, just the atmospheric empty environment. Lush painterly rendering, gothic dark-fantasy video-game aesthetic.' },
];

async function main() {
  const outDir = path.resolve('public/assets');

  for (const room of ROOMS) {
    const filename = `bg_${room.id}.jpg`;
    const outPath = path.join(outDir, filename);

    console.log(`Generating ${room.id}...`);
    try {
      const output = await replicate.run(
        "black-forest-labs/flux-pro",
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
      } else {
        console.log(`Unexpected output for ${room.id}:`, output);
      }
    } catch (e) {
      console.error(`Failed to generate ${room.id}:`, e);
    }
    
    // Wait 15 seconds to avoid rate limit
    console.log('Waiting 15s to avoid rate limit...');
    await new Promise(r => setTimeout(r, 15000));
  }
}

main().catch(console.error);
