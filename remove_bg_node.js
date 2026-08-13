import fs from 'fs/promises';
import path from 'path';
import Replicate from 'replicate';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function main() {
  const assetsDir = path.resolve('public/assets/avatar-tests');
  const files = await fs.readdir(assetsDir);
  const swatches = files.filter(f => f.startsWith('swatch_') || f.startsWith('anchor_'));
  
  const outDir = path.join(assetsDir, 'transparent');
  await fs.mkdir(outDir, { recursive: true });

  console.log(`Found ${swatches.length} images to process.`);

  for (const filename of swatches) {
    if (filename.endsWith('_transparent.png') || filename.includes('debug')) {
      continue;
    }
    
    const name = path.parse(filename).name;
    const outPath = path.join(outDir, `${name}_transparent.png`);
    
    try {
      await fs.access(outPath);
      console.log(`Skipping ${filename}, already processed.`);
      continue;
    } catch (e) {
      // File doesn't exist, proceed
    }

    console.log(`Processing ${filename}...`);
    try {
      const imgPath = path.join(assetsDir, filename);
      const imgBuffer = await fs.readFile(imgPath);
      const ext = path.extname(filename).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
      const base64 = `data:${mime};base64,${imgBuffer.toString('base64')}`;

      const output = await replicate.run(
        "lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
        {
          input: {
            image: base64
          }
        }
      );

      // Replicate might return a ReadableStream or a string URL depending on the model/client
      if (typeof output === 'string' && output.startsWith('http')) {
        const response = await fetch(output);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(outPath, buffer);
        console.log(`Saved transparent version to ${outPath}`);
      } else if (output && typeof output.getReader === 'function') {
        // It's a web ReadableStream
        const webStream = output;
        const nodeStream = Readable.fromWeb(webStream);
        const writeStream = createWriteStream(outPath);
        
        await new Promise((resolve, reject) => {
            nodeStream.pipe(writeStream);
            nodeStream.on('end', resolve);
            nodeStream.on('error', reject);
            writeStream.on('error', reject);
            writeStream.on('finish', resolve);
        });
        console.log(`Saved transparent version (stream) to ${outPath}`);
      } else {
        console.log(`Unexpected output for ${filename}:`, output);
      }
    } catch (e) {
      console.error(`Failed to process ${filename}:`, e);
    }
  }
}

main().catch(console.error);
