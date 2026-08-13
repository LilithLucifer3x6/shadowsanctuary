const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');
const https = require('https');
const sharp = require('sharp');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const portraitPrompt = `Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading (soft-edged shading transitions, not hard vector lines, not photographic smoothness or skin-pore detail) — combined with dramatic gothic chiaroscuro lighting (strong contrast between deep shadow and warm highlight), richly ornamental Victorian detail work, and moody saturated dark-fantasy color grading, anime-influenced expressive linework, illustrated portrait of a mystical Keeper. Plus size, full figure body type. Dark rich umber skin, and shoulder-length interlocked microlocs — deliberately palm-rolled and interlocked, ultra-thin, each individual loc clearly visible and separated, NOT two-strand twists, NOT braids, NOT loose curly or wavy hair adorned with nothing. Wearing an extravagantly opulent deep mahogany robe of Full-length flowing robe with wide sleeves and embroidered magical trim design — the wardrobe of a Victorian-era vampiric noble, dripping in opulence as though an entire country's treasury were behind it: dense silver embroidery, intricate beadwork, jeweled clasps, high structured collars, dramatic fitted sleeves, ornate brooches and cameos, dark romantic elegance, rich brocade and heavy embellished trim, sumptuous and expensive-looking in every detail, adorned with no jewelry. Plain neutral gray background. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.`;

  console.log("Invoking image proxy with model: black-forest-labs/flux-pro ...");
  const { data, error } = await supabase.functions.invoke('image-proxy', {
    body: {
      model: 'black-forest-labs/flux-pro',
      input: {
        prompt: portraitPrompt,
        width: 1024,
        height: 1024,
        output_format: 'jpg'
      }
    }
  });

  console.log("Raw Response:");
  console.log(JSON.stringify({data, error}, null, 2));

  if (data && data.output && data.output.length > 0) {
    const imageUrl = data.output[0];
    console.log("Downloading image from URL:", imageUrl);
    
    const dest = 'public/assets/flowing_ceremonial_mahogany_flux_pro_test.jpg';
    
    https.get(imageUrl, function(response) {
      let chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`Downloaded ${buffer.length} bytes, converting to JPEG via sharp...`);
        
        sharp(buffer)
          .jpeg()
          .toFile(dest)
          .then(() => {
            console.log("SUCCESS: Image converted to true JPEG and saved to", dest);
          })
          .catch(err => {
            console.error("Error during sharp conversion:", err);
          });
      });
    }).on('error', function(err) {
      console.error("Error downloading image:", err.message);
    });
  }
}
run();
