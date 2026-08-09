import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gwezojwujynharoqjuio.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZXpvand1anluaGFyb3FqdWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDUwNzgsImV4cCI6MjEwMTIyMTA3OH0.BPF1s-QjY0EF8xE6lumPDXxbZbg7XgPg1csVfPTNWdQ';
const supabase = createClient(supabaseUrl, supabaseKey);

const config = {
  locStyle: 'shoulder-length',
  hairAccessory: 'nothing',
  robeColor: 'mahogany',
  robeDesign: 'Full-length flowing robe with wide sleeves and embroidered magical trim',
  jewelry: 'no'
};

const portraitPrompt = `Hand-painted 2D animated dark-fantasy illustration portrait of a mystical Keeper. Plus size, full figure body type. Androgynous, dark rich umber skin, and ${config.locStyle || 'long'} extremely fine, thread-thin microlocs, each strand clearly individually visible, no thicker than embroidery floss adorned with ${config.hairAccessory || 'nothing'}. Wearing a deep ${config.robeColor || 'black'} gothic cottagecore robe of ${config.robeDesign || 'simple'} design, adorned with ${config.jewelry || 'no'} jewelry. Plain neutral gray background. Lush painterly rendering, expressive stylized character design, gothic dark-fantasy video-game aesthetic, moody atmospheric lighting with dramatic shadows. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.`;

import https from 'https';
import fs from 'fs';

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filename);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download image. Status: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function test() {
  console.log('Testing image-proxy edge function with prompt:\\n', portraitPrompt);
  
  const payload = {
    version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b', // SDXL base
    input: {
      prompt: portraitPrompt,
      negative_prompt: 'velvet, ornate circular frame, medallion border, face paint, tribal markings, decorative background, standing upright hair, bald, short hair',
      width: 1024,
      height: 1024
    }
  };

  try {
    const { data, error } = await supabase.functions.invoke('image-proxy', {
      body: payload
    });

    if (error) {
      console.error('Edge Function Error:', error.message);
      if (error.context && error.context.text) {
        console.error('Raw Error Body:', await error.context.text());
      }
    } else {
      console.log('Success! Raw Replicate Response:');
      console.log(JSON.stringify(data, null, 2));
      if (data.status === 'succeeded' && data.output && data.output.length > 0) {
        console.log('Downloading image...');
        await downloadImage(data.output[0], 'public/assets/flowing_ceremonial_mahogany_v8_negprompt_test.jpg');
        console.log('Image saved successfully.');
      }
    }
  } catch (err) {
    console.error('Network/Execution Error:', err);
  }
}

test();