import fs from 'fs/promises';
import path from 'path';
import Replicate from 'replicate';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { existsSync } from 'fs';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function main() {
  const assetsDir = path.resolve('public/assets/avatar-tests');
  const files = await fs.readdir(assetsDir);
  const swatches = files.filter(f => f.startsWith('swatch_') || f.startsWith('anchor_'));
  
  const outDir = path.join(assetsDir, 'transparent');
  await fs.mkdir(outDir, { recursive: true });

  // Read existing transparent files to skip them
  const existingFiles = await fs.readdir(outDir);
  const existingSet = new Set(existingFiles);

  for (const file of swatches) {
    if (!file.endsWith('.jpg') && !file.endsWith('.png')) continue;
    
    // Convert filename base
    const base = file.replace(/\.(jpg|png)$/, '');
    const outFilename = `${base}_transparent.png`;
    const outPath = path.join(outDir, outFilename);
    
    if (existingSet.has(outFilename)) {
      console.log(`Skipping ${file} - already processed`);
      continue;
    }

    console.log(`Processing ${file}...`);
    try {
      const fileData = await fs.readFile(path.join(assetsDir, file));
      const mime = file.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const b64 = fileData.toString('base64');
      const dataUri = `data:${mime};base64,${b64}`;

      const output = await replicate.run(
        "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        {
          input: {
            image: dataUri
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
        console.log(`Saved transparent version to ${outPath}`);
      } else if (downloadUrl && typeof downloadUrl.getReader === 'function') {
        const nodeStream = Readable.fromWeb(downloadUrl);
        const writeStream = createWriteStream(outPath);
        await new Promise((resolve, reject) => {
            nodeStream.pipe(writeStream);
            nodeStream.on('end', resolve);
            nodeStream.on('error', reject);
            writeStream.on('finish', resolve);
        });
        console.log(`Saved transparent version (stream) to ${outPath}`);
      } else {
        console.log(`Unexpected output for ${file}:`, output);
      }
    } catch (e) {
      console.error(`Failed to process ${file}:`, e);
    }
    
    // Throttle for rate limits
    console.log('Waiting 15s to avoid rate limit...');
    await new Promise(r => setTimeout(r, 15000));
  }
}

main().catch(console.error);
