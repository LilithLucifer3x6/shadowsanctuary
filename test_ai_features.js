import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testSummonByHand() {
  console.log('--- Testing Summon By Hand (Feature 16) ---');
  const { data, error } = await supabase.functions.invoke('anthropic-proxy', {
    body: {
      model: 'claude-sonnet-5',
      max_tokens: 800,
      tools: [{
        name: 'fill_product_details',
        description: 'Return your best-known data for this personal care or cosmetic product. If the product is handmade or generic (e.g. "DIY bath soak", "rosemary oil"), return reasonable ingredient defaults and typical shelf-life values.',
        input_schema: {
          type: 'object',
          properties: {
            brand: { type: 'string' },
            name: { type: 'string' },
            ingredients: { type: 'string', description: 'Comma-separated ingredient list' },
            category: { type: 'string', description: 'Human-readable product category, e.g. "Hair Oil", "Body Scrub", "Eye Serum"' },
            application_zones: { type: 'array', items: { type: 'string' }, description: 'Body areas this product is applied to, e.g. ["scalp", "hair", "face"]' },
            period_after_opening_months: { type: 'number' },
            unopened_shelf_life_months: { type: 'number' },
            item_type: { type: 'string', enum: ['consumable', 'arsenal', 'composite'] },
          },
          required: ['brand', 'name', 'ingredients', 'category', 'application_zones', 'item_type'],
        }
      }],
      tool_choice: { type: 'tool', name: 'fill_product_details' },
      messages: [{
        role: 'user',
        content: `You are a cosmetic product database. A user is adding this product to their personal care tracker.

Brand: CeraVe
Product name: Moisturizing Cream
Product domain: Form (Crown=hair/scalp, Visage=face, Gaze=eyes, Grin=oral, Form=body, Veil=makeup, Steeping=infused oils)

Return your best known data for this product. If it's a well-known commercial product, use real ingredient data. If it's handmade or generic, provide sensible defaults.`
      }]
    }
  });
  
  if (error) {
    console.error("Summon By Hand Proxy Error:", error);
  } else {
    console.log("Summon By Hand Success:", JSON.stringify(data, null, 2));
  }
}

async function testBatchUpload() {
  console.log('\n--- Testing Batch Upload (Feature 15) ---');
  
  const imgBuffer = fs.readFileSync('C:/Users/purpl/.gemini/antigravity/brain/0be76408-6bc5-4ff5-a2bb-20a516df3f62/anchor_kimono.jpg');
  const base64Img = imgBuffer.toString('base64');
  
  const { data, error } = await supabase.functions.invoke('anthropic-proxy', {
    body: {
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      tools: [{
        name: 'group_and_extract_products',
        description: 'Identifies all distinct cosmetic, medicinal, or care products...',
        input_schema: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { type: 'object', properties: { brand: { type: 'string' }, name: { type: 'string' } } } }
          },
          required: ['items']
        }
      }],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze these product photos. Extract cosmetic products.' },
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Img } }
          ]
        }
      ]
    }
  });
  
  if (error) {
    console.error("Batch Upload Proxy Error:");
    if (error.context && typeof error.context.text === 'function') {
        const text = await error.context.text();
        console.error("Context Body:", text);
    } else {
        console.error(error);
    }
  } else {
    console.log("Batch Upload Success:", JSON.stringify(data, null, 2));
  }
}

async function runAll() {
  await testSummonByHand();
  await testBatchUpload();
}

runAll();
