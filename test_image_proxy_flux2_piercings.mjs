import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import sharp from 'sharp';

const { Client } = pg;

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const dbUrl = env.SUPABASE_DB_URL;

if (!supabaseUrl || !supabaseAnonKey || !dbUrl) {
  console.error("Missing credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const testEmail = 'test_1786474323159@gmail.com';
const testPassword = 'flux_test_password_123!';

async function main() {
  console.log("Setting password in db...");
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  await client.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await client.query(`UPDATE auth.users SET encrypted_password = crypt($1, gen_salt('bf')), email_confirmed_at = NOW() WHERE email = $2`, [testPassword, testEmail]);
  await client.end();
  
  console.log("Signing in...");
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });
  
  if (signInErr || !signInData.session) {
    console.error("Sign in failed:", signInErr);
    process.exit(1);
  }
  
  const token = signInData.session.access_token;
  console.log("Got JWT.");
  
  const prompt = "Hand-painted 2D animated illustration in a soft painterly style with visible brushwork texture and gentle cel-shading (soft-edged shading transitions, not hard vector lines, not photographic smoothness or skin-pore detail) — combined with dramatic gothic chiaroscuro lighting (strong contrast between deep shadow and warm highlight), richly ornamental Victorian detail work, and moody saturated dark-fantasy color grading, anime-influenced expressive linework, illustrated portrait of a mystical Keeper. Plus size, full figure body type. Dark rich umber skin, and interlocked microlocs, each loc clearly separated and individually visible, medium-thin width, shoulder-length to collarbone-length maximum — NOT palm-rolled, NOT product-styled, NOT synthetic hair, NOT yarn or crochet extensions. Wearing an extravagantly opulent deep mahogany robe of Full-length flowing robe with wide sleeves and embroidered magical trim design — the wardrobe of a Victorian-era vampiric noble, dripping in opulence as though an entire country's treasury were behind it: dense silver embroidery, intricate beadwork, jeweled clasps, high structured collars, dramatic fitted sleeves, ornate brooches and cameos, dark romantic elegance, rich brocade and heavy embellished trim, sumptuous and expensive-looking in every detail. NO gold anywhere — no gold trim, no gold clasps, no gold jewelry, no gold accents of any kind, silver and dark metals only. Absolutely no jewelry — no necklace, no choker, no earrings, no rings, no bracelets, no pendants. Plain neutral gray background. No velvet texture anywhere; prefer flowing silk, brocade, or heavy wool-like fabrics instead. Soft glowing aura, calm expression.";
  
  console.log("Calling image-proxy with flux-pro...");
  const res = await fetch(`${supabaseUrl}/functions/v1/image-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      model: "black-forest-labs/flux-2-pro",
      input: {
        prompt: prompt,
        output_format: "jpg"
      }
    })
  });
  
  if (!res.ok) {
    console.error("Function Error:", res.status, await res.text());
    process.exit(1);
  }
  
  const result = await res.json();
  console.log("=== RAW PREDICTION RESPONSE ===");
  console.log(JSON.stringify(result, null, 2));
  
  if (result.output) {
    const imgUrl = Array.isArray(result.output) ? result.output[0] : result.output;
    console.log(`\nDownloading image from ${imgUrl}...`);
    const imgRes = await fetch(imgUrl);
    const buf = await imgRes.arrayBuffer();
    
    console.log("Converting to real JPEG via sharp...");
    await sharp(Buffer.from(buf))
      .jpeg()
      .toFile('public/assets/flowing_ceremonial_mahogany_flux2_test_piercings.jpg');
    console.log("Saved to public/assets/flowing_ceremonial_mahogany_flux2_test_piercings.jpg");
  } else {
    console.log("No output in response.");
  }
}

main().catch(console.error);
