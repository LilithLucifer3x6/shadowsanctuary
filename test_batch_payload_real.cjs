const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, v] = line.split('=');
  if (k && v) acc[k.trim()] = v.trim();
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Authenticating to get a valid JWT...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'test_1786474323159@gmail.com',
    password: 'flux_test_password_123!'
  });

  if (authErr) {
    console.error("Auth failed:", authErr.message);
    return;
  }
  
  const jwt = authData.session.access_token;
  console.log("Authenticated. Proceeding with Edge Function call...");

  const files = [
    path.resolve('product1.jpg'),
    path.resolve('product2.jpg'),
    path.resolve('product3.jpg')
  ];

  const base64Images = files.map(f => {
    const data = fs.readFileSync(f);
    return `data:image/jpeg;base64,${data.toString('base64')}`;
  });

  // Construct the exact Anthropic messages format
  const contentBlocks = base64Images.map(b64 => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: 'image/jpeg',
      data: b64.replace('data:image/jpeg;base64,', '') // Remove data URI prefix for Claude API
    }
  }));

  contentBlocks.push({
    type: 'text',
    text: "Identify these three items based on their labels. Output ONLY their names."
  });

  console.log("\nInvoking anthropic-proxy edge function...");
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: "You are a botanical and alchemical ingredients identifier. Extract the exact text visible on the labels.",
        messages: [{ role: 'user', content: contentBlocks }]
      })
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    const text = await response.text();
    
    console.log(`\nResponse Status: ${response.status}`);
    console.log(`Execution Time: ${duration}s`);
    
    if (response.ok) {
      console.log("\nSUCCESS! Claude Vision extracted the following:");
      console.log(JSON.parse(text).content[0].text);
    } else {
      console.log("\nFAILED.");
      console.log("Error body:", text);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

main();
