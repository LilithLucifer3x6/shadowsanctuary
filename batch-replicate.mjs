import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import https from 'https';

const supabase = createClient('https://gwezojwujynharoqjuio.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZXpvand1anluaGFyb3FqdWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NDUwNzgsImV4cCI6MjEwMTIyMTA3OH0.BPF1s-QjY0EF8xE6lumPDXxbZbg7XgPg1csVfPTNWdQ');

const ROBE_DESIGNS = [
  { id: 'flowing_ceremonial', label: 'Flowing Ceremonial Robe', desc: 'Full-length flowing robe with wide sleeves and embroidered magical trim' },
  { id: 'structured_coat', label: 'Sorceress Coat', desc: 'Structured long coat with a cinched waist belt and high dramatic collar' },
  { id: 'kimono_wrap', label: 'Kimono-Style Wrap Robe', desc: 'Elegant wrap robe with a wide obi-style sash belt' },
  { id: 'asymmetric', label: 'Asymmetric Ritual Robe', desc: 'Dramatic asymmetric hem with layered fabric and one exposed shoulder' },
  { id: 'layered_scholar', label: 'Scholar\'s Layered Robes', desc: 'Multiple layered robes with intricate detail and overlapping panels' },
  { id: 'cape_gown', label: 'Cape & Gown Ensemble', desc: 'Elegant fitted gown with a sweeping dramatic floor-length cape' },
  { id: 'embroidered_gown', label: 'Embroidered Ritual Gown', desc: 'Form-flattering gown covered in glowing magical embroidery patterns' },
  { id: 'brocade_robe', label: 'Brocade Wrap Robe', desc: 'Luxurious brocade robe with plush dark fur trim and deep side pockets' },
  { id: 'off_shoulder', label: 'Off-Shoulder Sorceress Gown', desc: 'Dramatic off-shoulder gown with puffed sleeves and layered skirt' },
  { id: 'hooded_cloak', label: 'Hooded Ritual Cloak', desc: 'Long hooded cloak with a fitted inner robe visible at the hem' }
];

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

async function generateRobe(robe, index) {
  const config = {
    locStyle: 'shoulder-length',
    hairAccessory: 'nothing',
    robeColor: 'mahogany',
    robeDesign: robe.desc,
    jewelry: 'no'
  };

  const portraitPrompt = `Hand-painted 2D animated dark-fantasy illustration portrait of a mystical Keeper. Plus size, full figure body type. Androgynous, dark rich umber skin, and ${config.locStyle || 'long'} extremely fine, thread-thin microlocs, each strand clearly individually visible, no thicker than embroidery floss adorned with ${config.hairAccessory || 'nothing'}. Wearing a deep ${config.robeColor || 'black'} gothic cottagecore robe of ${config.robeDesign || 'simple'} design, adorned with ${config.jewelry || 'no'} jewelry. Plain neutral gray background. Lush painterly rendering, expressive stylized character design, gothic dark-fantasy video-game aesthetic, moody atmospheric lighting with dramatic shadows. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.`;

  const payload = {
    version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
    input: { prompt: portraitPrompt, width: 1024, height: 1024 }
  };

  console.log(`[ ${index + 1} / ${ROBE_DESIGNS.length} ] Calling edge function for ${robe.id}...`);
  
  const { data, error } = await supabase.functions.invoke('image-proxy', { body: payload });
  
  if (error) {
    console.error(`\nERROR FOR ${robe.id}:`);
    console.error(error.message);
    if (error.context && error.context.text) {
      console.error(await error.context.text());
    }
    return null;
  }

  const resultStatus = {
    id: robe.id,
    prediction_id: data.id,
    status: data.status
  };
  
  console.log(JSON.stringify(resultStatus));

  if (data.status === 'succeeded' && data.output && data.output.length > 0) {
    const imageUrl = data.output[0];
    const filename = robe.id === 'flowing_ceremonial' 
      ? `public/assets/flowing_ceremonial_mahogany_v7_real_pipeline.jpg` 
      : `public/assets/robe_${robe.id}_v7_real_pipeline.jpg`;
    
    await downloadImage(imageUrl, filename);
  }

  return resultStatus;
}

async function runBatch() {
  const results = [];
  for (let i = 1; i < ROBE_DESIGNS.length; i++) {
    const res = await generateRobe(ROBE_DESIGNS[i], i);
    results.push(res);
    if (i < ROBE_DESIGNS.length - 1) {
      console.log('Waiting 12 seconds to respect Replicate rate limits (6 req/min)...');
      await new Promise(resolve => setTimeout(resolve, 12000));
    }
  }
  
  console.log('\n--- BATCH COMPLETE ---');
  console.log(JSON.stringify(results, null, 2));
}

runBatch();