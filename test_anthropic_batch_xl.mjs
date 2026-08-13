import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const testEmail = 'test_1786474323159@gmail.com';
const testPassword = 'flux_test_password_123!';

async function main() {
  console.log("Signing in...");
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });
  
  if (signInErr || !signInData.session) {
    console.error("Sign in failed:", signInErr);
    process.exit(1);
  }
  
  console.log("Got JWT.");

  // Use test image
  const imgData = fs.readFileSync('public/assets/flowing_ceremonial_mahogany_flux2_test.jpg');
  const base64 = imgData.toString('base64');
  const mediaType = 'image/jpeg';
  
  const images = Array.from({length: 200}).map((_, i) => ({ base64, mediaType, filename: 'test' + i + '.jpg' }));
  
  console.log("Simulating parseBatchProductImages with 40 images...");
  
  const tools = [
    {
      name: 'group_and_extract_products',
      description: 'Groups multiple product images into distinct products and extracts their details',
      input_schema: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filenames: { type: 'array', items: { type: 'string' } },
                brand: { type: 'string' },
                name: { type: 'string' }
              },
              required: ['filenames', 'brand', 'name']
            }
          }
        },
        required: ['products']
      }
    }
  ];

  const contentBlocks = images.map(img => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: img.mediaType,
      data: img.base64
    }
  }));

  contentBlocks.push({
    type: 'text',
    text: `I have uploaded ${images.length} images. They have the following filenames in order: ${images.map(i => i.filename).join(', ')}.\nYour task is to analyze all images simultaneously and GROUP them into distinct products.`
  });

  try {
    const { data, error } = await supabase.functions.invoke('anthropic-proxy', {
      body: { 
        model: 'claude-sonnet-5', // Assuming this is defined
        max_tokens: 4096,
        messages: [{ role: 'user', content: contentBlocks }],
        tools: tools,
        tool_choice: { type: 'tool', name: 'group_and_extract_products' }
      }
    });

    if (error) {
      console.error("Invoke Error:", error);
      console.log("Error details:", JSON.stringify(error, null, 2));
    } else {
      console.log("Invoke Success:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Caught Exception:", err);
  }
}

main().catch(console.error);
