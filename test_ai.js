import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLookup() {
  console.log("Testing lookupProductDetails via edge function...");
  const body = {
    model: 'claude-sonnet-5',
    max_tokens: 800,
    tools: [{
        name: 'fill_product_details',
        description: 'Return your best-known data for this personal care or cosmetic product. If the product is handmade or generic (e.g. "DIY bath soak", "rosemary oil"), return reasonable ingredient defaults and typical shelf-life values.',
        input_schema: {
          type: 'object',
          properties: {
            brand:                       { type: 'string' },
            name:                        { type: 'string' },
            ingredients:                 { type: 'string', description: 'Comma-separated ingredient list' },
            category:                    { type: 'string', description: 'Human-readable product category, e.g. "Hair Oil", "Body Scrub", "Eye Serum"' },
            application_zones:           { type: 'array', items: { type: 'string' }, description: 'Body areas this product is applied to, e.g. ["scalp", "hair", "face"]' },
            period_after_opening_months: { type: 'number', description: 'Typical months until expiry after opening (PAO). Null if unknown.' },
            unopened_shelf_life_months:  { type: 'number', description: 'Typical unopened shelf life in months. Null if unknown.' },
            item_type:                   { type: 'string', enum: ['consumable', 'arsenal', 'composite'], description: '"consumable" for products, "arsenal" for tools/devices, "composite" for handmade mixes' },
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

Return your best known data for this product. If it's a well-known commercial product, use real ingredient data. If it's handmade or generic, provide sensible defaults.`
    }]
  };

  const start = Date.now();
  const { data, error } = await supabase.functions.invoke('anthropic-proxy', {
    body
  });
  console.log(`Time taken: ${Date.now() - start}ms`);
  
  if (error) {
    console.error("Proxy error:", error);
  } else {
    console.log("Proxy response:", JSON.stringify(data, null, 2));
  }
}

testLookup();
