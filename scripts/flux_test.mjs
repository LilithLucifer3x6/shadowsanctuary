// Reads REPLICATE_API_TOKEN from .env — never logs or prints the value.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dir, '..', '.env');

const token = readFileSync(envPath, 'utf8')
  .split('\n')
  .find(l => l.startsWith('REPLICATE_API_TOKEN='))
  ?.split('=').slice(1).join('=').trim();

if (!token) { console.error('REPLICATE_API_TOKEN not found in .env'); process.exit(1); }

// Exact portraitPrompt from ConjureVisage.jsx, robeDesign=flowing_ceremonial, robeColor=mahogany
const prompt = [
  "Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading (soft-edged shading transitions, not hard vector lines, not photographic smoothness or skin-pore detail) — combined with dramatic gothic chiaroscuro lighting (strong contrast between deep shadow and warm highlight), richly ornamental Victorian detail work, and moody saturated dark-fantasy color grading, anime-influenced expressive linework, illustrated portrait of a mystical Keeper.",
  "Plus size, full figure body type.",
  "Dark rich umber skin, and long extremely fine, thread-thin microlocs,",
  "each strand clearly individually visible, no thicker than embroidery floss adorned with nothing.",
  "Wearing an extravagantly opulent deep mahogany robe of flowing_ceremonial design — the wardrobe of a Victorian-era vampiric noble, dripping in opulence as though an entire country's treasury were behind it: dense silver embroidery, intricate beadwork, jeweled clasps, high structured collars, dramatic fitted sleeves, ornate brooches and cameos, dark romantic elegance, rich brocade and heavy embellished trim, sumptuous and expensive-looking in every detail, adorned with no jewelry.",
  "Plain neutral gray background.",
  "No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead.",
  "Soft glowing aura, calm expression."
].join(' ');

// Flux Dev uses the model-scoped predictions endpoint, not /v1/predictions
// See: https://replicate.com/docs/reference/http#models.predictions.create
const endpoint = 'https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions';

const payload = {
  input: { prompt, width: 1024, height: 1024 }
};

console.log('Submitting to Replicate (flux-dev, Prefer: wait)...');

const res = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'wait'
  },
  body: JSON.stringify(payload)
});

const data = await res.json();

if (!res.ok) {
  console.error(`HTTP ${res.status}: ${data.detail ?? JSON.stringify(data)}`);
  process.exit(1);
}

console.log(`Prediction ID : ${data.id}`);
console.log(`Status        : ${data.status}`);
console.log(`Model         : ${data.model ?? 'black-forest-labs/flux-dev'}`);
console.log(`Output URL    : ${Array.isArray(data.output) ? data.output[0] : data.output ?? '(none yet)'}`);

const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output;
if (outputUrl) {
  writeFileSync(join(__dir, 'flux_output_url.txt'), outputUrl);
}
