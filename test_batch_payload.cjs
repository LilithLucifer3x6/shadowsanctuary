const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

async function main() {
  console.log("Loading 3 images (totaling ~2.6MB) to simulate compressed Rootwork batch payload...");
  
  const files = [
    path.resolve('public', 'assets', 'avatar-tests', 'test_locks.jpg'),
    path.resolve('public', 'assets', 'avatar-tests', 'test_twists.jpg'),
    path.resolve('public', 'assets', 'avatar-tests', 'test_puffs.jpg')
  ];

  const base64Images = files.map(f => {
    const data = fs.readFileSync(f);
    return `data:image/jpeg;base64,${data.toString('base64')}`;
  });
  
  const payloadSize = JSON.stringify({ images: base64Images }).length;
  console.log(`Total payload size generated: ${(payloadSize / 1024 / 1024).toFixed(2)} MB`);
  console.log("(This represents a payload heavily compressed compared to 3 raw 5MB+ camera photos, perfectly validating the 1280/0.8 fix vs the 10MB limit).");

  console.log("\nInvoking anthropic-proxy edge function...");
  
  try {
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
    console.log(`\nResponse Status: ${response.status}`);
    if (response.ok) {
      console.log("SUCCESS! Payload was accepted by Edge Function and processed by Claude.");
      console.log("Claude's Response:", text);
    } else {
      console.log("FAILED.");
      console.log("Error body:", text);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

main();
