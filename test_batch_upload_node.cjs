const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

async function compressImage(filePath, maxWidth = 1280, quality = 0.8) {
  const image = await loadImage(filePath);
  let width = image.width;
  let height = image.height;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);

  // Return base64 string
  return canvas.toDataURL('image/jpeg', quality);
}

async function main() {
  console.log("Compressing 3 images at 1280px / 0.8 quality (mirroring Rootwork.jsx)...");
  
  const files = [
    path.resolve('public', 'assets', 'avatar-tests', 'test_locks.jpg'),
    path.resolve('public', 'assets', 'avatar-tests', 'test_twists.jpg'),
    path.resolve('public', 'assets', 'avatar-tests', 'test_puffs.jpg')
  ];

  const base64Images = [];
  for (const file of files) {
    const b64 = await compressImage(file, 1280, 0.8);
    base64Images.push(b64);
  }
  
  const payloadSize = JSON.stringify({ images: base64Images }).length;
  console.log(`Total payload size: ${(payloadSize / 1024 / 1024).toFixed(2)} MB`);

  console.log("Invoking anthropic-proxy edge function...");
  const fetch = (await import('node-fetch')).default;
  
  const response = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/anthropic-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      images: base64Images,
      systemPrompt: "You are a botanical identifier.",
      userPrompt: "Identify these items."
    })
  });

  const text = await response.text();
  console.log(`Response Status: ${response.status}`);
  if (response.ok) {
    console.log("SUCCESS! Payload was accepted and processed.");
    console.log("Response data:", text.substring(0, 200) + "...");
  } else {
    console.log("FAILED.");
    console.log("Error body:", text);
  }
}

main();
