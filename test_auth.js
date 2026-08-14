import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('Invoking proxy with tool payload...');
  const { data, error } = await supabase.functions.invoke('anthropic-proxy', {
    body: {
      model: 'claude-sonnet-5',
      max_tokens: 800,
      tools: [{
        name: 'fill_product_details',
        description: '...',
        input_schema: {
          type: 'object',
          properties: {
            brand: { type: 'string' },
            name: { type: 'string' },
            ingredients: { type: 'string' },
            category: { type: 'string' },
            application_zones: { type: 'array', items: { type: 'string' } },
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
Product domain: Form (Crown=hair/scalp, Visage=face, Gaze=eyes, Grin=oral, Vessel=body, Veil=makeup, Steeping=infused oils)

Return your best known data for this product.`
      }]
    }
  });
  
  if (error) {
    console.error("Error from Edge Function:");
    if (error.context && typeof error.context.text === 'function') {
        const text = await error.context.text();
        console.error("Context Body:", text);
    } else {
        console.error(error);
    }
  } else {
    console.log("Success data:", JSON.stringify(data, null, 2));
  }
}

run();
